const { renderFullBody, renderHead } = require("minecraft-skins");
const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const mc = require('vis-yggdrasil-tools');
const rateLimit = require('express-rate-limit');
const NodeCache = require("node-cache");

const skinCache = new NodeCache();

async function getSkin(req, res) {
    try {
        const startTime = new Date();
        console.log(`[${startTime.toLocaleString()}] Incoming request: ${req.method} ${req.originalUrl}`);
        
        let { name, type } = req.params;
        const scale = parseInt(req.query.scale) || 25; 
        if (scale > 50) {
            console.log(`[${new Date().toLocaleString()}] Action forbidden: Scale exceeds limit`);
            return res.status(403).json({'code': '403', 'error': 'Action forbidden'});
        }
        if (scale < 1) {
            console.log(`[${new Date().toLocaleString()}] Action forbidden: Scale is under limit`);
            return res.status(403).json({'code': '403', 'error': 'Action forbidden'});
        }
        
        if (!isUUID(name)) {
            const player = new mc.player(name);
            let uuidData;
            try {
                console.log(`[${new Date().toLocaleString()}] Fetching UUID for player: ${name}`);
                uuidData = await mc.nameToUuid(player);
                console.log(`[${new Date().toLocaleString()}] UUID data received: ${JSON.stringify(uuidData)}`);
            } catch (error) {
                console.log(`[${new Date().toLocaleString()}] Error fetching UUID for player: ${name}`, error);
                name = 'VI_Software'; // Fallback to VI_Software
            }
            if (!uuidData || !uuidData.uuid) {
                console.log(`[${new Date().toLocaleString()}] Player not found: ${name}`);
                name = 'VI_Software'; // Fallback to VI_Software
            } else {
                name = uuidData.uuid;
            }
        }

        const cachedSkin = skinCache.get(`${name}_${type}_${scale}`);
        if (cachedSkin) {
            console.log(`[${new Date().toLocaleString()}] Cache hit for skin: ${name}_${type}_${scale}`);
            return sendResponse(res, cachedSkin);
        }

        const player = new mc.player(name);
        const skinData = await mc.getSkin(player);
        if (!skinData || !skinData.skin) {
            console.log(`[${new Date().toLocaleString()}] Skin not found for player: ${name}`);
            name = 'VI_Software'; // Fallback to VI_Software
            const fallbackPlayer = new mc.player(name);
            const fallbackSkinData = await mc.getSkin(fallbackPlayer);
            if (!fallbackSkinData || !fallbackSkinData.skin) {
                return res.status(404).json({'code': '404', 'error': 'Skin not found'});
            }
            skinData.skin = fallbackSkinData.skin;
        }

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
        
        const endTime = new Date();
        const duration = endTime - startTime;
        console.log(`[${endTime.toLocaleString()}] Request processed in ${duration}ms`);
    } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).json({'code': '500', 'error': 'Internal Server Error'});
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