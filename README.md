# 时间盲盒

手机上的一枚小签筒。普通的一天里，它给你一张轻的、安全的、花不了多少钱的小事，让生活轻轻偏出原来的轨迹。

这不是待办，也不是占卜。签号和「上上签」只是玩法称呼，不作吉凶。

每天最多求签 **3 次**，换签也算一次。三炷香灭了，就要等到本地时间的零点。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 [http://127.0.0.1:4317](http://127.0.0.1:4317)。手机和电脑都可以，窄屏是主场。

其他命令：

```bash
npm test
npm run lint
npm run build
npm run preview
```

`npm run build` 会先生成一万支签，再产出可静态部署的 `dist/`。资源使用相对路径，放在任意子目录也能打开。签文按块放在 `dist/slips/`，第一次求签才下载对应的一块。生产环境需要 HTTPS，通知和「添加到主屏幕」才会完整可用。

## 怎么玩

1. 打开就点「求签」。没有时间、心气或同伴的筛选，签筒直接给你一件小事。签筒会摇，香会起，钟会响，然后看到「命运的齿轮开始转动」，最后落下签文。
2. 收下这签，去做。做完在「缘分日志」里写两句，也可以附一张照片。
3. 不想要这一支，就「换签」。今天连第一次在内一共只有 3 次。同一支签要等签筒里很大一部分都被求过，才会再出现。
4. 在「我的签」里可以写下自己的签，它会进入同一个签筒。
5. 「随缘时刻」里选一段每天的时辰。应用会在其中随机挑一个片刻：页面开着且允许通知时会轻声敲你；若当时不在，下次打开会看到签筒已暖。具体分钟不会提前显示。

## 数据放在哪

没有账号。求过哪些签、缘分日志和照片只在这台设备上：文字在 `localStorage`，照片在 IndexedDB。清站点数据就会消失。每天 3 次求签也只看本地，广场连不上时照常求签。

挂到广场的小故事会上传：称呼、签号、签文、故事，以及一个存在本地的匿名 `clientId`。没有登录。

## 广场

底部「广场」可以看别人挂上来的小事。求到签之后，有一句「完成后，把小故事挂到广场」：起一个称呼（这台设备会记住），写 200 字以内的故事。每台设备每天最多挂 5 则，同一网络每天最多 15 则。每则故事可以点一次「同感」，再点取消。举报满 3 次会从广场收起。

广场接口若还在醒来（Render 免费实例大约要几十秒），页面会写「香火正在点燃…」并自己再试。这不影响求签。

## 部署

静态站仍是 Render 上的 `shijian-manghe`：`npm ci && npm run build`，发布 `dist/`。`render.yaml` 里另有一个 Node 服务 `shijian-manghe-api`（`rootDir: server`，免费套餐）。

在 Render 仪表盘给 API 填 `DATABASE_URL`，用 Neon Postgres 的连接串（带 `sslmode=require`）。这项在 Blueprint 里是 `sync: false`，之后的同步不会覆盖你填的值。API 启动时如果缺表会自己建。

前端默认请求 `https://shijian-manghe-api.onrender.com`。若 API 域名不同，在静态站**构建前**设置 `VITE_API_URL`。

本地把 API 跑起来：

```bash
cd server
npm ci
DATABASE_URL=postgres://USER:PASSWORD@127.0.0.1:5432/tbb npm start
```

它监听 `PORT`，没设时是 `8787`。前端开发时可以在仓库根目录建 `.env`：

```bash
VITE_API_URL=http://127.0.0.1:8787
```

接口：

- `GET /api/health`
- `GET /api/posts?cursor=&clientId=`
- `POST /api/posts`，正文 `{ nickname, slipNumber, slipText, story, clientId }`
- `POST /api/posts/:id/like`，正文 `{ clientId }`
- `POST /api/posts/:id/report`，正文 `{ clientId }`

## 技术

Vite、React、TypeScript、Tailwind CSS、shadcn/ui。界面是简体中文。
