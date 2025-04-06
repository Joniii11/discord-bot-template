declare global {
    /**
     * The __dirname global variable in esm is not available by default. 
     * This reenables it.
     * 
     * @returns {string} 
     */
    var dirname: () => string;
}

export {};