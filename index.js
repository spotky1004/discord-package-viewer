import fs from "fs";
import path from "path";
import csvParser from "csv-parser";

const __dirname = path.resolve();

/**
 * @typedef Message
 * @property {string} ID
 * @property {string} Timestamp
 * @property {string} Contents
 * @property {string} Attachments
 */
/**
 * @typedef GuildData
 * @property {string} id
 * @property {string[]} names
 * @property {string} channelIds
 */
/**
 * @typedef ChannelData
 * @property {string} id
 * @property {string[]} names
 * @property {Message[]} messages
 */
/**
 * @typedef GroupData
 * @property {string} id
 * @property {string[]} names
 * @property {string[]} recipients
 */

/**
 * @typedef Status
 * @property {number} channelCount
 * @property {number} guildCount
 * @property {number} dmCount
 * @property {number} messageCount
 */

const data = {
  /** @type {Object.<string, ChannelData>} */
  channels: {},
  /** @type {Object.<string, GuildData>} */
  guilds: {},
  /** @type {string[]} */
  dms: [],
  /** @type {Object.<string, GroupData>} */
  groups: {},
  /** @type {Status} */
  status: {
    channelCount: 0,
    guildCount: 0,
    dmCount: 0,
    messageCount: 0,
  },
};

let packages = fs.readdirSync(path.join(__dirname, "packages"));
let packageNewest = [];

// Sort packages old from new
for (let i = 0; i < packages.length; i++) {
  const packageFolderName = packages[i];
  const messageFolderPath = path.join(__dirname, "packages", packageFolderName, "messages");
  if (fs.existsSync(messageFolderPath)) {
    const index = JSON.parse(fs.readFileSync(path.join(messageFolderPath, "index.json")));
    const newest = Object.keys(index).sort((a, b) => (+b) - (+a))[0];
    
    packageNewest[i] = newest;
  }
}
packages = packages.map((p, i) => [p, packageNewest[i]]).sort(([_pA, a], [_pB, b]) => (+a) - (+b)).map(([p, _]) => p);

/**
 * @constant
 * @type {["GUILD_TEXT", "DM", "GUILD_VOICE", "GROUP_DM", "GUILD_CATEGORY", "GUILD_NEWS", "GUILD_STORE", "", "", "", "GUILD_NEWS_THREAD", "GUILD_PUBLIC_THREAD", "GUILD_PRIVATE_THREAD", "GUILD_STAGE_VOICE"]}
 */
const ChannelTypes = [
  "GUILD_TEXT", "DM", "GUILD_VOICE", "GROUP_DM", "GUILD_CATEGORY",
  "GUILD_NEWS", "GUILD_STORE", "", "", "",
  "GUILD_NEWS_THREAD", "GUILD_PUBLIC_THREAD", "GUILD_PRIVATE_THREAD", "GUILD_STAGE_VOICE"
]
// Get data from packages
for (let i = 0; i < packages.length; i++) {
  console.log("Parsing package #", i)

  const packageFolderName = packages[i];
  const messageFolderPath = path.join(__dirname, "packages", packageFolderName, "messages");
  if (fs.existsSync(messageFolderPath)) {
    /** @type {Object.<string, string>} */
    const index = JSON.parse(fs.readFileSync(path.join(messageFolderPath, "index.json")));
    const messageFolderNames = fs.readdirSync(messageFolderPath).filter(v => v !== "index.json");
    
    for (const channelId in index) {
      const channelFolderPath = path.join(messageFolderPath, messageFolderNames.find(_id => _id.includes(channelId)));

      const name = index[channelId];
      /**
       * @typedef DiscordChannelData
       * @property {string} id
       * @property {number} type
       * @property {string} name
       * @property {{ id: string, name: string }} [guild]
       * @property {string[]} [recipients]
       */
      /** @type {DiscordChannelData} */
      const channel = JSON.parse(fs.readFileSync(path.join(channelFolderPath, "channel.json")));
      /** @type {typeof ChannelTypes[number]} */
      const type = ChannelTypes[channel.type];

      /** @type {Message[]} */
      let messages = [];
      const messageStream = new Promise(function(resolve, reject) {
        fs.createReadStream(path.join(channelFolderPath, "messages.csv"))
          .pipe(csvParser())
          .on("data", (data) => messages.push(data))
          .on("end", resolve)
          .on("error", reject);
      });
      await messageStream;

      let channelData = data.channels[channelId];
      if (channelData) {
        channelData.names.push(name);
        channelData.names = [...new Set(channelData.names)];
        /** @type {Message[]} */
        let messagesMerged = [...channelData.messages, ...messages];
        messagesMerged = messagesMerged.map(message => [message.ID, message]);
        messagesMerged = Object.entries(Object.fromEntries(messagesMerged)).map(([_mId, m]) => m);
        messagesMerged = messagesMerged.sort((a, b) => (+a.ID) - (+b.ID));
        channelData.messages = messagesMerged;
      } else {
        data.channels[channelId] = {
          id: channelId,
          names: [name],
          messages: messages
        }
        channelData = data.channels[channelId];
      }

      if (type === "DM") {
        data.dms.push(channelId);
        data.dms = [...new Set(data.dms)];
      } else if (
        channel.guild &&
        (type === "GUILD_TEXT" || type === "GUILD_PUBLIC_THREAD" || type === "GUILD_PRIVATE_THREAD")
      ) {
        let guild = data.guilds[channel.guild.id];
        if (!guild) {
          guild = {
            names: [],
            channelIds: []
          };
          data.guilds[channel.guild.id] = guild;
        }
        if (guild.channelIds.findIndex(_channelId => _channelId === channelId) === -1) {
          guild.channelIds.push(channelId);
        }
        guild.names.push(channel.guild.name);
        guild.names = [...new Set(guild.names)];
      } else if (type === "GROUP_DM") {
        let group = data.groups[channelId];
        if (!group) {
          group = {
            id: channelId,
            recipients: channel.recipients,
          };
          data.groups[channelId] = group;
        } else {
          group.recipients = [...new Set([...group.recipients, channel.recipients])]
        }
      }
    }
  }
}

/** @type {Status} */
data.status = {
  channelCount: Object.keys(data.channels).length,
  dmCount: data.dms.length,
  guildCount: Object.keys(data.guilds).length,
  messageCount: Object.entries(data.channels).reduce((messageCount, [_channelId, channel]) => messageCount + channel.messages.length, 0)
};

fs.writeFileSync(path.join(__dirname, "data.json"), JSON.stringify(data, null, 2));
fs.writeFileSync(path.join(__dirname, "src", "data.js"), "const discordPackage = " + JSON.stringify(data, null, 2) + ";\nwindow.discordPackage = discordPackage;\nexport default discordPackage;");
