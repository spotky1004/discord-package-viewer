import discordPackage from "../data.js";

const elements = {
  status: {
    message: document.querySelector("#status__message > .status__value"),
    channels: document.querySelector("#status__channel > .status__value"),
    guilds: document.querySelector("#status__guild > .status__value"),
    dms: document.querySelector("#status__dm > .status__value"),
  },
  selectorNav: {
    guild: document.querySelector("#data-type-select > div:nth-child(1)"),
    dm: document.querySelector("#data-type-select > div:nth-child(2)"),
  },
  mainScreen: {
    placeholder: document.querySelector("#main-screen > #placeholder"),
    selector: document.querySelector("#main-screen > #selector"),
    viewer: document.querySelector("#main-screen > #viewer"),
  },
  selector: {
    title: document.querySelector("#selector__title"),
    list: document.querySelector("#selector__list"),
  },
  viewer : {
    title: document.querySelector("#viewer__title"),
    list: document.querySelector("#viewer__message-container"),
  }
};

// Set status
elements.status.message.innerText = discordPackage.status.messageCount;
elements.status.channels.innerText = discordPackage.status.channelCount;
elements.status.guilds.innerText = discordPackage.status.guildCount;
elements.status.dms.innerText = discordPackage.status.dmCount;
elements.selectorNav.guild.innerText = `Guild (${discordPackage.status.guildCount}) ➤`;
elements.selectorNav.dm.innerText = `DM (${discordPackage.status.dmCount}) ➤`;

/** @typedef {"Guilds" | "Guild" | "DMs" | "Channel"} SelectTypes */
/** @type {SelectTypes!} */
let selectType = null;
/**
 * @param {SelectTypes} type 
 * @param {string} id 
 * @param {string} name
 */
function openData(type, id, name) {
  selectType = type;

  elements.mainScreen.placeholder.style.display = "none";
  elements.mainScreen.selector.style.display = "none";
  elements.mainScreen.viewer.style.display = "none";

  if (type === "Guilds") {
    elements.mainScreen.selector.style.display = "";
    elements.selector.list.innerHTML = "";
    elements.selector.title.innerText = `Guilds (${discordPackage.status.guildCount})`;
    for (const guildId in discordPackage.guilds) {
      const guild = discordPackage.guilds[guildId];
      const guildName = guild.names.slice(-1)[0];
      const btn = document.createElement("span");
      btn.classList.add("selector__item");
      btn.dataset.id = guildId;
      btn.dataset.name = guild.names.join(", ");
      btn.innerHTML = `${guildName} (${guild.channelIds.length}) ➤`;
      elements.selector.list.appendChild(btn);
    }
  } else if (type === "Guild") {
    elements.mainScreen.selector.style.display = "";
    elements.selector.list.innerHTML = "";
    const guild = discordPackage.guilds[id];
    const channels = guild.channelIds.map(id => discordPackage.channels[id]);
    elements.selector.title.innerText = `${name} (${channels.length})`;
    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i];
      const channelName = channel.names.filter(v => v).slice(-1)[0];
      const btn = document.createElement("span");
      btn.classList.add("selector__item");
      btn.dataset.id = channel.id;
      btn.dataset.name = channelName;
      btn.innerHTML = `${channelName} (${channel.messages.length}) ➤`;
      elements.selector.list.appendChild(btn);
    } 
  } else if (type == "DMs") {
    elements.mainScreen.selector.style.display = "";
    elements.selector.list.innerHTML = "";
    const channels = discordPackage.dms.map(id => discordPackage.channels[id]);
    elements.selector.title.innerText = `DMs (${channels.length})`;
    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i];
      const channelNames = [...channel.names].map(names => names.replace("Direct Message with ", ""))
      const channelName = channelNames.filter(v => v).slice(-1)[0];
      const btn = document.createElement("span");
      btn.classList.add("selector__item");
      btn.dataset.id = channel.id;
      btn.dataset.name = channelNames.join(", ");
      btn.innerHTML = `${channelName} (${channel.messages.length}) ➤`;
      elements.selector.list.appendChild(btn);
    } 
  } else if (type === "Channel") {
    elements.mainScreen.viewer.style.display = "";
    elements.viewer.title.innerText = `#${name} (${id})`;
    elements.viewer.list.innerHTML = "";
    const messages = discordPackage.channels[id].messages;
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      const messageEle = document.createElement("div");
      messageEle.classList.add("message");
      elements.viewer.list.appendChild(messageEle);

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
elements.selector.list.addEventListener("click", (e) => {
  const target = e.target;
  if (target && target.classList.contains("selector__item")) {
    if (selectType === "Guilds") {
      openData("Guild", target.dataset.id, target.dataset.name);
    } else if (selectType === "Guild" || selectType === "DMs") {
      openData("Channel", target.dataset.id, target.dataset.name);
    }
  }
});
