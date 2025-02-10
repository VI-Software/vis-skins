const { renderFullBody, renderHead } = require("minecraft-skins");
const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const mc = require('vis-yggdrasil-tools');
const rateLimit = require('express-rate-limit');
const NodeCache = require("node-cache");

const skinCache = new NodeCache();
const tempDir = path.join(__dirname, '../temp');

// Ensure temp directory exists
const ensureTempDir = async () => {
    try {
        await fs.access(tempDir);
    } catch {
        await fs.mkdir(tempDir, { recursive: true });
    }
};

// Initialize temp directory
ensureTempDir().catch(console.error);

async function getSkin(req, res) {
    try {
        const startTime = new Date();
        console.log(`[${startTime.toLocaleString()}] Incoming request: ${req.method} ${req.originalUrl}`);
        
        let { name, type } = req.params;
        const scale = Math.min(Math.max(parseInt(req.query.scale) || 25, 1), 50);
        
        const fallbackToDefault = async () => {
            console.log(`[${new Date().toLocaleString()}] Falling back to VI_Software skin`);
            const defaultPlayer = new mc.player('VI_Software');
            const defaultSkinData = await mc.getSkin(defaultPlayer);
            if (!defaultSkinData || !defaultSkinData.skin) {
                throw new Error('Default skin not available');
            }
            return defaultSkinData.skin;
        };

        try {
            if (!isUUID(name)) {
                const player = new mc.player(name);
                const uuidData = await mc.nameToUuid(player).catch(() => null);
                if (!uuidData || !uuidData.uuid) {
                    return await handleSkinRender(await fallbackToDefault(), type, scale, res);
                }
                name = uuidData.uuid;
            }

            const cachedSkin = skinCache.get(`${name}_${type}_${scale}`);
            if (cachedSkin) {
                return sendResponse(res, cachedSkin);
            }

            const player = new mc.player(name);
            const skinData = await mc.getSkin(player).catch(() => null);
            const skinUrl = skinData?.skin || await fallbackToDefault();
            
            await handleSkinRender(skinUrl, type, scale, res);

        } catch (error) {
            console.error(`Skin processing error:`, error);
            const fallbackSkin = await fallbackToDefault();
            await handleSkinRender(fallbackSkin, type, scale, res);
        }

    } catch (error) {
        console.error("Fatal error:", error);
        res.status(500).json({
            code: '500',
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

async function handleSkinRender(skinUrl, type, scale, res) {
    let tempPath = null;
    try {
        await ensureTempDir(); // Ensure temp directory exists before each operation
        
        const response = await axios.get(skinUrl, { responseType: "arraybuffer" });
        tempPath = path.join(tempDir, `${Date.now()}.png`);
        await fs.writeFile(tempPath, response.data);
        
        const skinImage = await fs.readFile(tempPath);
        const render = type === 'head' ? 
            await renderHead(skinImage, { scale }) : 
            await renderFullBody(skinImage, { scale });

        sendResponse(res, render);

    } catch (error) {
        console.error("Render error:", error);
        throw error;
    } finally {
        // Clean up temp file if it exists
        if (tempPath) {
            try {
                await fs.unlink(tempPath);
            } catch (err) {
                console.error("Failed to clean up temp file:", err);
            }
        }
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