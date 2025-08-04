const { InlineKeyboard } = require("grammy");
const { setWait } = require("./users-functions");

async function sendFeedbackRequest(ctx) {

    const inline = new InlineKeyboard()
        .text('Отменить', 'cancel');

    const msg = await ctx.reply('Напиши <b>своё сообщение</b> разработчику, если требуется, <b>прикрепи</b> скриншоты/видео', {
        reply_markup: inline,
        parse_mode: 'HTML',
    });

    await setWait(ctx.from.id, { id: 'feedback', deleteMessageId: msg.message_id });

}

module.exports = {
    sendFeedbackRequest,
};
