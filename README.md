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

1. 按住签筒，或轻轻摇一摇手机。没有时间、心气或同伴的筛选，签筒直接给你一件小事。签筒会摇，香会起，签飞出来，墨晕开，字一个一个落下。也可以点「直接求签」。
2. 收下这签，去做。做完在「缘分日志」里写两句，也可以附一张照片。若愿意，点「完成后，把小故事挂到广场」，让别人看见这一小段。
3. 不想要这一支，就「换签」。今天连第一次在内一共只有 3 次。同一支签要等签筒里很大一部分都被求过，才会再出现。
4. 在「我的签」里可以写下自己的签，它会进入同一个签筒。
5. 「随缘时刻」里选一段每天的时辰。应用会在其中随机挑一个片刻：页面开着且允许通知时会轻声敲你；若当时不在，下次打开会看到签筒已暖。具体分钟不会提前显示。木鱼和钟默认是关的，在这里打开。

## 数据放在哪

没有账号。求过哪些签、故事文字在 `localStorage`。照片在 IndexedDB，不会上传。广场只提交绰号、签文和你写下的故事；访客记号 `clientId` 也存在这台设备上。清站点数据就会消失。

## 广场接口

前端请求 `VITE_API_URL`，没有配置时用 `https://shijian-manghe-api.onrender.com`。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | `{ ok: true }` |
| GET | `/api/posts?cursor=&clientId=` | 新的在前，每页 20 条 |
| POST | `/api/posts` | `{ nickname, slipNumber, slipText, story, clientId }` |
| POST | `/api/posts/:id/like` | `{ clientId }`，再点一次取消同感 |
| POST | `/api/posts/:id/report` | `{ clientId }`，同一访客只记一次，满 3 次就藏起 |

绰号最多 16 字，故事 1 到 200 字。不收链接，挡一层明显的脏话。同一个 `clientId`、同一个 IP，滚动 24 小时内最多 5 条。跨域只放行 `https://shijian-manghe.onrender.com` 和本机 localhost。

## 部署到 Render

`render.yaml` 有两个服务，都从 `main` 自动部署。

- `shijian-manghe`：静态站。构建 `npm ci && npm run build`，发布 `dist`。构建时写入 `VITE_API_URL`。
- `shijian-manghe-api`：Node 网站服务，目录 `server`，免费计划。启动 `npm start`，健康检查 `/api/health`。

在 Render 上给 API 填环境变量 `DATABASE_URL`（Neon 的连接串，需要 SSL）。Blueprint 里它是 `sync: false`，不会被仓库覆盖。免费服务大约十五分钟没人用会睡去，广场会显示「香火正在点燃…」，求签不依赖它。

本地同时跑接口：

```bash
createdb shijian_manghe
cd server
npm ci
DATABASE_URL=postgres://localhost:5432/shijian_manghe npm test
DATABASE_URL=postgres://localhost:5432/shijian_manghe npm start
```

另一个终端：

```bash
VITE_API_URL=http://127.0.0.1:8787 npm run dev
```

API 监听 `0.0.0.0` 和 `PORT`（本地默认 8787）。

## 技术

Vite、React、TypeScript、Tailwind CSS、shadcn/ui。界面是简体中文。
