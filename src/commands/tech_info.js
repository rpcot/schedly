module.exports = {
    name: 'tech_info',
    description: 'Техническая информация о боте',
    async execute(bot, ctx) {
        const text = `<b>💡 Разработчик</b>
        • <a href="https://t.me/rpcotik">@rpcotik</a>

        <b>🤖 Бот</b>
        • Бот: <a href="https://t.me/raspisssanie_bot">SCHEDLY</a>
        • Версия бота: <code>v2.9.1</code>
        • Последнее обновление: <code>26.02.2026</code>

        <b>🌐 Сайт</b>
        • Сайт: <a href="https://schedly.rpcot.ru">schedly.rpcot.ru</a>
        • Версия сайта: <code>v3.2.1</code>
        • Последнее обновление: <code>08.03.2026</code>
        
        <b>🧩 API</b>
        • API: <a href="https://api.schedule.rpcot.ru">api.schedule.rpcot.ru</a>
        • Версия API: <code>v2.6.0</code>
        • Последнее обновление: <code>26.02.2026</code>

        <b>🛠 Стек технологий</b>
        • Язык программирования: <code>JavaScript</code>
        • Версия Node.js: <code>${process.version}</code>
        • База данных: <code>MySQL</code>
        • Фронтэнд: <code>React 19 + Chakra UI v2</code>

        <b>📂 GitHub</b>
        • https://github.com/rpcot/schedly
        • https://github.com/rpcot/schedly-frontend
        `.replace(/  +/g, '');

        await ctx.reply(text, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        });
    }
};
