const { InlineKeyboard } = require("grammy");
const { getTempChangelogById, updateTempChangelogEntry, showTempChangelog, getChangelogsConfig, createChangelogEntry } = require("../utils/changelog-functions");
const { setWait } = require("../utils/users-functions");

module.exports = {
    data: 'changelog',
    async execute(bot, ctx, tempChangelogId, action, arg1) {
        const data = getTempChangelogById(tempChangelogId);
        const { systems: allSystems } = await getChangelogsConfig();

        const systemOrder = new Map();
        Object.keys(allSystems).forEach((id, index) => {
            systemOrder.set(id, index);
        });

        if (!data)
            return void await ctx.answerCallbackQuery('Информация о выбранном ченджлоге не найдена');

        if (action === 'set_type') {
            data.type = arg1;
        } else if (action === 'toggle_system') {
            const systemId = arg1;

            if (data.involvedSystems.includes(systemId)) {
                const index = data.involvedSystems.indexOf(systemId);
                data.involvedSystems.splice(index, 1);
            } else {
                data.involvedSystems.push(systemId);
                data.involvedSystems.sort((a, b) => systemOrder.get(a) - systemOrder.get(b));
            }
        } else if (action === 'add_body') {
            const inline = new InlineKeyboard();

            for (const system of Object.values(allSystems)) {
                inline
                    .text(system.name, `changelog?:${tempChangelogId}?:add_body_system?:${system.id}`)
                    .row();
            }

            inline.text('Отмена', `changelog?:${tempChangelogId}?:cancel`);

            return void await ctx.editMessageText('Выбери нужную систему', {
                reply_markup: inline,
            });
        } else if (action === 'add_body_system') {
            const systemId = arg1;

            if (data.body.find((body) => body.systemId === systemId))
                return void await ctx.answerCallbackQuery('Выбранная система уже есть');

            data.body.push({ systemId, version: null, items: [] });
            data.body.sort((a, b) => systemOrder.get(a.systemId) - systemOrder.get(b.systemId));

            updateTempChangelogEntry(tempChangelogId, data);

            await setWait(ctx.from.id, { id: 'changelog_add_body_version', editMessageId: ctx.msg.message_id, systemId, tempChangelogId });

            const inline = new InlineKeyboard()
                .text('Отменить', `changelog?:${tempChangelogId}?:cancel`);

            return void await ctx.editMessageText('Укажи версию для системы', {
                reply_markup: inline,
            });
        } else if (action === 'confirm_system') {
            const systemId = arg1;

            const systemItems = data.body.find((system) => system.systemId === systemId).items;

            if (systemItems.length === 0)
                return void await ctx.answerCallbackQuery('Нужно добавить хотя бы 1 изменение');

            await setWait(ctx.from.id, {});
        } else if (action === 'add_image') {
            await setWait(ctx.from.id, {
                id: 'changelog_add_image_name',
                editMessageId: ctx.msg.message_id,
                tempChangelogId,
            });

            const inline = new InlineKeyboard()
                .text('Отменить', `changelog?:${tempChangelogId}?:cancel`);

            return void await ctx.editMessageText('Напиши название для изображения', {
                reply_markup: inline,
            });
        } else if (action === 'save') {
            await createChangelogEntry(data.version, data.type, data.title, data.involvedSystems, data.body, data.images, data.date);

            const text = ctx.msg.text.replace('Список изменений', '<b>Список изменений — Сохранено</b>');

            return void await ctx.editMessageText(text, {
                parse_mode: 'HTML',
                reply_markup: null,
            });
        }

        data.body = data.body.filter((system) => system.items.length !== 0);
        data.images = data.images.filter((image) => !!image.url);

        updateTempChangelogEntry(tempChangelogId, data);

        await showTempChangelog(ctx, data);
        
        await setWait(ctx.from.id, {});
    }
};
