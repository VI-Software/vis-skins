const { renderFullBody, renderHead } = require("minecraft-skins");
const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const mc = require('vis-yggdrasil-tools');
const rateLimit = require('express-rate-limit');
const NodeCache = require("node-cache");

const skinCache = new NodeCache();

// Rate limiting options (100 requests per hour per IP)
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 100, 
    message: 'Too many requests from this IP, please try again later.'
});

async function getSkin(req, res) {
    try {
        let { name, type } = req.params;
        const scale = parseInt(req.query.scale) || 25; 
        if (!isUUID(name)) {
            const player = new mc.player(name);
            const uuidData = await mc.nameToUuid(player);
            if (!uuidData || !uuidData.uuid) {
                return res.status(404).send('Player not found');
            }
            name = uuidData.uuid; 
        }

        const cachedSkin = skinCache.get(`${name}_${type}_${scale}`);

        if (cachedSkin) {
            return sendResponse(res, cachedSkin);
        }

        const player = new mc.player(name);
        const skinData = await mc.getSkin(player);

        const skinUrl = skinData.skin;
        const response = await axios.get(skinUrl, { responseType: "arraybuffer" });

        const skinPath = path.join(__dirname, `../assets/${name}.png`);
        await fs.writeFile(skinPath, response.data);

        const skinImage = await fs.readFile(skinPath);

        let render;
        if (type === 'head') {
            render = await renderHead(skinImage, { scale });
        } else {
            render = await renderFullBody(skinImage, { scale });
        }

        // Cache the skin with the render type and scale
        skinCache.set(`${name}_${type}_${scale}`, render);

        // Send the response
        sendResponse(res, render);

        // Delete the intermediary file
        fs.unlink(skinPath);
    } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).send('Internal Server Error');
    }
}

function sendResponse(res, data) {
    res.set('Content-Type', 'image/png');
    res.send(data);
}

function isUUID(str) {
    return /^[a-f\d]{8}-([a-f\d]{4}-){3}[a-f\d]{12}$/i.test(str);
}

module.exports = { getSkin };
