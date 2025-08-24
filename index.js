const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const SHAPE_SLUG = "karsten"; // your Shapes AI slug
let karstenReset = false;
const DELAY = 700; // milliseconds between replies

// Safety net for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// Talk to Karsten
async function talkToKarsten(prompt) {
  try {
    const response = await axios.post(
      'https://api.shapes.inc/v1/chat/completions',
      {
        model: `shapesinc/${SHAPE_SLUG}`,
        messages: [
          { role: 'user', content: prompt || '🤯 g-gah!' }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SHAPES_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Shapes API error:", error?.response?.data || error.message);
    return "🤯 Karsten stolpert über seine Fakten, aber glaubt fest daran! 😅";
  }
}

// Ready event
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({
    activities: [{ name: '🔍 Verschwörungen analysieren… 🤯' }],
    status: 'online',
  });
});

// Message handler
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();
  const mentioned = message.mentions.has(client.user);
  let shouldRespond = false;
  let prompt = "";

  // Optional reset command
  if (content.startsWith('!karstenreset')) {
    karstenReset = true;
    await message.reply("Karsten ist bereit für neue Verschwörungen! 🤯🔍");
    return;
  }

  // Trigger if pinged or starts with "karsten"
  if (mentioned) {
    prompt = message.content.replace(/<@!?(\d+)>/, '').trim();
    shouldRespond = true;
  } else if (content.startsWith("karsten")) {
    prompt = message.content.slice(7).trim();
    shouldRespond = true;
  } else if (Math.random() < 0.1) {
    // 10% chance to respond randomly
    prompt = message.content;
    shouldRespond = true;
  }

  if (!shouldRespond) return;

  const reply = await talkToKarsten(prompt);
  await sendMultiMessages(message, reply);
});

// Helper to safely split and send multiple messages
async function sendMultiMessages(message, reply) {
  let replies = [];

  if (reply.includes('•')) {
    replies = reply.split('•').map(l => l.trim()).filter(l => l);
    replies = replies.map(l => `• ${l}`);
  } else {
    replies = reply.split('\n').map(l => l.trim()).filter(l => l);
  }

  for (const line of replies) {
    try {
      await message.reply(line);
    } catch (err) {
      console.warn("Reply failed, sending normally instead:", err.message);
      await message.channel.send(line);
    }
    await new Promise(r => setTimeout(r, DELAY));
  }
}

client.login(process.env.DISCORD_TOKEN);
