const path = require("path");

const HOME = process.env.HOME || "/home/joe";
const ROOT = __dirname;

module.exports = {
    apps: [
        {
            name: "magicmirror",
            script: path.join(ROOT, "scripts", "start_magicmirror.sh"),
            interpreter: "bash",
            cwd: ROOT,
            time: true,
            autorestart: true,
            max_restarts: 10,
            restart_delay: 5000,
            env: {
                MM_DIR: process.env.MM_DIR || path.join(HOME, "MagicMirror"),
                ENV_FILE: process.env.ENV_FILE || "/etc/magicmirror.env",
                DISPLAY: process.env.DISPLAY || ":0"
            }
        }
    ]
};