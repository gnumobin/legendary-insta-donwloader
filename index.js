'use strict';
const { Telegraf } = require('telegraf');
require('dotenv').config();
// Secure Variables
const { TOKEN, API_TOKEN } = process.env;
// Excute Telegraf
const bot = new Telegraf(TOKEN)
// Local Variables
let storyFlag = false;
const channels = [
    {
        link: 'https://t.me/gnuInstaDownloader',
        chatID: '-1001977857438'
    }
];
const state = {}
// Methods
// Bot Commands 
// Start Command
bot.command('start', ctx => {
    const username = ctx.message.from.first_name;
    const msg = `Hi ${username}, please subscribe to the following channels to use the bot 🥰`
    state.welcomeMsgID = bot.telegram.sendMessage(ctx.chat.id, msg, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Channel', callback_data: 'channel', url: channels[0].link }
                ],
                [
                    { text: 'Done', callback_data: 'joinedDone' }
                ]
            ]
        }
    })
})

bot.action('joinedDone', async ctx => {
    const msg = `Please join our channels 😡`;
    const chatID = channels[0].chatID;
    const wlcMsgID = (await state.welcomeMsgID)?.message_id;

    const userStatus = (await bot.telegram.getChatMember(chatID, ctx.from.id)).status

    if (userStatus == 'left')
        ctx.answerCbQuery(msg)
    else {
        const msg = `Hi ${ctx.from.first_name} 🫡\nhow can I help you?`
        ctx.deleteMessage(wlcMsgID)
        ctx.replyWithHTML(msg, {
            reply_markup: {
                keyboard: [
                    [
                        { text: '🌟 Story' }
                    ],
                    [
                        { text: '💻 Developer' }
                    ]
                ]
            }
        })
    }
})

bot.hears('💻 Developer', (ctx) => {
    const msg = `Hi, I develop this bot 🥰\nI hope you are satisfied with the robot`
    ctx.replyWithHTML(msg, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Message Me 😉', url: 'https://t.me/gnu_Mobin' }
                ]
            ]
        }
    })
    storyFlag = false
})

bot.hears('🌟 Story', (ctx) => {
    storyFlag = true
    const msg = `Please send the page ID wtih @ 😜\nWithout sending @ before the username, the bot will not return any response`
    ctx.replyWithHTML(msg)
})


const donwloadStoryHandler = async ctx => {
    let mainData = [[], []];
    const userMsg = ctx.message.text;
    const waitMsgTxt = 'Connecting to the server, please wait a moment'

    const waitMsg = (await ctx.replyWithHTML(waitMsgTxt)).message_id;

    if (storyFlag) {
        storyFlag = false;
        // Create username for fetch api
        const username = userMsg.slice(1, userMsg.length);
        // Get User from instagram
        ctx.sendChatAction("typing")
        let getUser_URL = `https://one-api.ir/instagram/?token=${API_TOKEN}&action=user&username=${username}`;
        const responseUser = await (await fetch(getUser_URL)).json()
        if (responseUser.status !== 200) {
            ctx.replyWithHTML(`Oh sorry, I couldn't find a user with that name on Instagram 😔`)
        } else {
            // Find instagram account user num id
            const findedUserID = responseUser.result.id;
            // Get Stories Url
            ctx.sendChatAction("typing")
            const getStory_URL = `https://one-api.ir/instagram/?token=${API_TOKEN}&action=user_stories&id=${findedUserID}`;

            const stories = await (await fetch(getStory_URL)).json()

            if (stories.status === 200) {
                ctx.sendChatAction("typing")
                const { result } = stories;
                if (result) {
                    // ctx.replyWithHTML('Which story number do you want? ☺️')
                    if (result.length > 3) {
                        await result.forEach((story, num) => {
                            const item = { text: num + 1, callback_data: `donwloadStory_${num}`, story }
                            const equal = result.length / 2;
                            num < equal ? mainData[0].push(item) : mainData[1].push(item)
                        });
                    } else {
                        mainData = [result.map((story, num) => {
                            return { text: num + 1, callback_data: `donwloadStory_${num}`, story }
                        })]
                    }
                    ctx.replyWithHTML('Which story number do you want? ☺️', {
                        reply_markup: {
                            inline_keyboard: mainData
                        }
                    })

                    // downloadStoriesEvent(mainData)
                    return mainData;

                } else {
                    ctx.replyWithHTML('Currently, this user does not have any active stories 🙃')
                }
            } else ctx.replyWithHTML('There is a problem with the server 😔. Please try again in a few minutes 🙏🏼')
        }
    }
    ctx.deleteMessage(waitMsg)
    return null
}


bot.on('text', async ctx => {
    if (!ctx.message.text.includes('@')) {
        return false;
    }
    
    const data = await donwloadStoryHandler(ctx)

    if (data) {
        if (data.length > 1) {
            data.forEach(row => {
                row.forEach(btn => {
                    ctx.sendChatAction("upload_document")
                    const { callback_data, story: { type, url } } = btn;
                    bot.action(callback_data, ctx => {
                        type === 'photo' ? ctx.replyWithPhoto(url) : ctx.replyWithVideo(url);
                    })
                })
            })
        } else {
            data.forEach(btn => {
                const { callback_data, story: { type, url } } = btn;
                console.log(callback_data);
                bot.action(callback_data, ctx => {
                    type === 'photo' ? ctx.replyWithPhoto(url) : ctx.replyWithVideo(url);
                    console.log(story);
                })
            });
        }
    }
})

// Run bot 
bot.launch();