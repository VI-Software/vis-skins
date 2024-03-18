/*
    ____   ____.___    _________       _____  __                                 
\   \ /   /|   |  /   _____/ _____/ ____\/  |___  _  _______ _______   ____  
 \   Y   / |   |  \_____  \ /  _ \   __\\   __\ \/ \/ /\__  \\_  __ \_/ __ \ 
  \     /  |   |  /        (  <_> )  |   |  |  \     /  / __ \|  | \/\  ___/ 
   \___/   |___| /_______  /\____/|__|   |__|   \/\_/  (____  /__|    \___  >
                         \/                                 \/            \/ 
                         
                         
    Copyright 2024 (©) VI Software y contribuidores. Todos los derechos reservados.
    
    GitHub: https://github.com/VI-Software
    Web: https://vis.galnod.com

*/

class SkinCache {
    constructor() {
        this.cache = new Map();
    }

    get(name, type) {
        const key = `${name}_${type}`;
        return this.cache.get(key);
    }

    set(name, type, data) {
        const key = `${name}_${type}`; 
        this.cache.set(key, data);
    }
}

module.exports = new SkinCache();
