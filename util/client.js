const loadExtensions = require('./extensionLoader.js');
const audioPlayer = require('./audioPlayer.js');
const messageCollector = require('./messageCollector.js');
const extras = require('./extras.js');
const superagent = require('superagent')
const fs = require('fs');
const Eris = loadExtensions(require('eris'));
const { Client } = Eris;
const Base = require('eris-sharder').Base;
require('dotenv').config()


class MiyukiClient extends Client {
    constructor (config, clientOptions) {
        if (Array.isArray(clientOptions.disableEvents)) {
            clientOptions.disableEvents = extras.disable(clientOptions.disableEvents);
        }

        super(process.env.SECRET, clientOptions);
        
        this.EmbedUp = require('./EmbedUp.js')
        this.util = require('./util.js')
        this.config = config;
        this.audioPlayers = new Map();
        this.commands = new Map();
        this.aliases = new Map();
        this.messageCollector = new messageCollector(this);

        this._loadCommands();
    }

    _loadCommands () {
        fs.readdir(`${process.cwd()}/src/commands/`, (err, files) => {
            if (err) {
                return this.log('ERROR', 'Unable to index "commands"', err);
            }

            files.forEach(file => {
                try {
                    const command = require(`${process.cwd()}/src/commands/${file}`);
                    const name = file.replace('.js', '').toLowerCase();
                    this.commands.set(name, command);

                    if (command.aliases) {
                        for (const alias of command.aliases) {
                            this.aliases.set(alias, name);
                        }
                    }
                } catch(e) {
                    this.log('ERROR', `Failed to load command "${file}"`, e.message, e.stack);
                }
            });
        });
    }

    getAudioPlayer (guildId) {
        if (!this.audioPlayers.has(guildId)) {
            this.audioPlayers.set(guildId, new audioPlayer(this, guildId));
        }

        return this.audioPlayers.get(guildId);
    }

    log (logLevel, content, ...extras) {
        const time = new Date();
        const timestamp = `${time.toDateString()} ${time.toLocaleTimeString()}`;
        console.log(`[${timestamp}] [${logLevel.padEnd(5, ' ')}] ${content}${extras.length > 0 ? `\n\t${extras.join('\n\t').trim()}` : ''}`); // eslint-disable-line
    }

    async awaitMessage (channelId, check, timeout) {
        const result = await this.messageCollector.awaitMessages(channelId, check, timeout);
        return result;
    }
}

module.exports = MiyukiClient;
