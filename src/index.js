import discordPackage from "./data.js";

const elements = {
  status: {
    message: document.querySelector("#status__message > .status__value"),
    channels: document.querySelector("#status__channel > .status__value"),
    guilds: document.querySelector("#status__guild > .status__value"),
    dms: document.querySelector("#status__dm > .status__value"),
    groups: document.querySelector("#status__group > .status__value"),
  },
  selectorNav: {
    guild: document.querySelector("#data-type-select > div:nth-child(1)"),
    dm: document.querySelector("#data-type-select > div:nth-child(2)"),
    group: document.querySelector("#data-type-select > div:nth-child(3)"),
  },
  mainScreen: {
    placeholder: document.querySelector("#main-screen > #placeholder"),
    viewer: document.querySelector("#main-screen > #viewer"),
  },
  selector: document.querySelector("#selector"),
  channel : {
    title: document.querySelector("#channel__title"),
    list: document.querySelector("#channel__message-container"),
  }
};

// Set status
elements.status.message.innerText = discordPackage.status.messageCount;
elements.status.channels.innerText = discordPackage.status.channelCount;
elements.status.guilds.innerText = discordPackage.status.guildCount;
elements.status.dms.innerText = discordPackage.status.dmCount;
elements.status.groups.innerText = discordPackage.status.groupCount;
elements.selectorNav.guild.innerText = `Guild (${discordPackage.status.guildCount}) ➤`;
elements.selectorNav.dm.innerText = `DM (${discordPackage.status.dmCount}) ➤`;
elements.selectorNav.group.innerText = `Group (${discordPackage.status.groupCount}) ➤`;

/**
 * @param {object} obj
 * @param {string} obj.id 
 * @param {string} obj.content
 * @param {number} obj.itemCount
 * @param {string} obj.names
 */
function addListItem({ id, content, itemCount, names }) {
  const item = document.createElement("span");
  item.classList.add("selector__item");
  item.dataset.id = id;
  item.dataset.names = names;
  item.dataset.itemCount = itemCount.toString().padStart(5, "0");
  item.innerHTML = content;
  elements.selector.appendChild(item);
}

/** @typedef {"Guilds" | "Guild" | "DMs" | "Groups"} SelectTypes */
/** @type {SelectTypes!} */
let selectType = null;
/**
 * @param {SelectTypes} type 
 * @param {string} id 
 * @param {string} name
 */
function openData(type, id, name) {
  elements.mainScreen.placeholder.style.display = "none";
  elements.mainScreen.viewer.style.display = "";

  if (type === "Guilds") {
    selectType = "Guilds";
    elements.selector.innerHTML = "";
    const guilds = Object.entries(discordPackage.guilds).map(v => v[1]).sort((a, b) => b.newestId - a.newestId);
    for (let i = 0; i < guilds.length; i++) {
      const guild = guilds[i];
      // const guildName = guild.names.slice(-1)[0];
      addListItem({
        content: [...guild.names].reverse().join(", "),
        id: guild.id,
        itemCount: (guild.channelIds.length.toString().padStart(5, "0")) + "▸" + (guild.totalMessages.toString().padStart(5, "0")),
        names: guild.names.join(", ")
      });
    }
  } else if (type === "Guild") {
    selectType = "Guild";
    elements.selector.innerHTML = "";
    const guild = discordPackage.guilds[id];
    const channels = guild.channelIds.map(id => discordPackage.channels[id]).sort((a, b) => b.totalMessages - a.totalMessages);
    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i];
      const channelName = channel.names.filter(v => v).slice(-1)[0];
      addListItem({
        content: channelName,
        id: channel.id,
        itemCount: channel.totalMessages,
        names: channel.names.filter(v => v).join(", ")
      });
    } 
  } else if (type === "DMs") {
    selectType = "DMs";
    elements.selector.innerHTML = "";
    const channels = discordPackage.dms.map(id => discordPackage.channels[id]).sort((a, b) => b.newestId - a.newestId);
    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i];
      const channelNames = [...channel.names].map(names => names.replace("Direct Message with ", ""))
      const channelName = channelNames.filter(v => v).slice(-1)[0];
      addListItem({
        content: channelName,
        id: channel.id,
        itemCount: channel.totalMessages,
        names: channelNames.filter(v => v).join(", ")
      });
    } 
  } else if (type === "Groups") {
    selectType = "Groups";
    elements.selector.innerHTML = "";
    const groups = Object.entries(discordPackage.groups).map(v => v[1]).map(v => discordPackage.channels[v.id]).sort((a, b) => b.newestId - a.newestId);
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      addListItem({
        content: [...group.names].reverse().join(", "),
        id: group.id,
        itemCount: group.totalMessages.toString(),
        names: group.names.join(", ")
      });
    }
  } else if (type === "Channel") {
    elements.channel.title.innerText = (selectType === "Guild" ? "#" : "@") + name;
    elements.channel.list.innerHTML = "";
    let messages = [...discordPackage.channels[id].messages].reverse();
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      const messageEle = document.createElement("div");
      messageEle.classList.add("message");
      elements.channel.list.appendChild(messageEle);

      const messageData = document.createElement("div");
      messageData.classList.add("message__data");
      messageEle.appendChild(messageData);

      const userName = document.createElement("span");
      userName.innerText = `Me (${message.ID})`;
      userName.classList.add("message__data__user-name");
      messageData.append(userName);

      const timestamp = document.createElement("span");
      timestamp.innerText = message.Timestamp;
      timestamp.classList.add("message__data__timestemp");
      messageData.append(timestamp);

      const messageContent = document.createElement("span");
      messageContent.innerText = message.Contents + (message.Attachments ? "\n" + message.Attachments : "");
      messageContent.classList.add("message__content");
      messageEle.append(messageContent);
    }
  }
}

// Set events
elements.selectorNav.guild.addEventListener("click", () => {
  openData("Guilds");
});
elements.selectorNav.dm.addEventListener("click", () => {
  openData("DMs");
});
elements.selectorNav.group.addEventListener("click", () => {
  openData("Groups");
});
elements.selector.addEventListener("click", (e) => {
  const target = e.target;
  if (target && target.classList.contains("selector__item")) {
    if (selectType === "Guilds") {
      openData("Guild", target.dataset.id, target.dataset.names);
    } else if (selectType === "Guild" || selectType === "DMs" || selectType === "Groups") {
      openData("Channel", target.dataset.id, target.dataset.names);
    }
  }
});
