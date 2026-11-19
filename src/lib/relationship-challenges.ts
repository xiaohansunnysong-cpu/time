import type { Category, Duration, Relationship } from "@/lib/types"

export const RELATIONSHIPS: Array<{ id: Relationship; label: string; hint: string }> = [
  { id: "self", label: "自己", hint: "给自己一点新鲜感" },
  { id: "family", label: "家人", hint: "和家人做件小事" },
  { id: "parent-child", label: "亲子", hint: "一起玩一小会儿" },
  { id: "friend", label: "朋友", hint: "给友情加个支线" },
  { id: "lover", label: "恋人", hint: "制造一点亲密感" },
  { id: "colleague", label: "同事", hint: "轻松友好不越界" },
]

type Task = { title: string; description: string; duration: Duration; category: Category; verse: string }
const task = (title: string, description: string, duration: Duration, category: Category, verse: string): Task => ({ title, description, duration, category, verse })

export const RELATIONSHIP_TASKS: Record<Relationship, Task[]> = {
  self: [
    task("闭眼听完歌单里的第二首歌", "找个安稳的位置坐下，闭眼听完歌单里的第二首歌。听完记下脑海里的第一个画面。", 5, "music", "耳朵替今天开一扇窗"),
    task("买一枝花送给自己", "挑一枝预算内喜欢的花，带回家找个顺眼的位置摆好。不想花钱，就摘一片安全可拾的落叶。", 15, "kindness", "这份心意，先留给自己"),
    task("认真读眼前一本书的两页", "随手拿起一本书读两页，圈出或记下一个让你停顿的词。", 5, "book", "两页之间，藏着一点新鲜"),
    task("给今天的心情选个天气", "用晴、阴、雾、阵雨或你自创的天气形容此刻心情，再补一句原因。", 5, "create", "心情也有自己的天色"),
    task("走一条熟悉路线上的新小路", "选一段安全、明亮的小路走十分钟，留意一个以前没发现的细节。", 15, "city", "拐个弯，日常就换了景"),
    task("给自己泡杯喜欢的热饮", "用家里已有的材料泡一杯热饮，坐下来慢慢喝几口。", 5, "food", "热气升起，暂停开始"),
    task("拍一张普通东西的电影海报", "给杯子、窗影或鞋子拍一张照片，再给这部电影起个名字。", 5, "photo", "今天的主角不必远方"),
    task("做五分钟舒展", "选几个舒服的伸展动作，做到身体觉得轻松为止；不舒服就停下来。", 5, "slow", "身体说慢一点，就慢一点"),
    task("看一部喜剧电影", "选一部你没看过的喜剧电影，备好水或茶，安心看一会儿。时间不够就看完一段并记下一个好笑的瞬间。", 60, "slow", "让笑声替今天松松绑"),
  ],
  family: [
    task("请家人推荐一首老歌", "问一位家人：‘哪首歌会让你想起以前？’一起听一小段，也分享你的选择。", 15, "music", "旧歌里，有家的回声"),
    task("问家人一件旧物的来历", "选一件家里常见的旧物，问问它从哪里来、为什么留下。", 15, "memory", "旧物有一段没讲完的话"),
    task("和家人互相夸一件小事", "轮流说一件最近欣赏对方做的小事，越具体越好。", 5, "family", "一句具体的话，落在心上"),
    task("今天主动洗一次碗", "替家人洗一次碗，或把自己的餐具收拾干净。洗完给自己一个小小的‘下班了’仪式。", 15, "family", "水声里，家务少了一件"),
    task("一起做一道最简单的点心", "用家里现有的食材一起准备一份简单点心；不方便下厨，就一起摆盘水果。", 15, "food", "厨房今天多一个搭档"),
    task("和家人交换一个童年故事", "各讲一个小时候的小片段，可以好笑也可以普通，不必讲不想说的事。", 15, "memory", "小时候的你，今天来串门"),
    task("请家人教你一个小技能", "请家人教你一道菜的一个步骤、一个手工技巧或一个生活窍门。", 15, "family", "今天换你当学生"),
    task("一起散步十分钟", "找一条熟悉、安全的路线散步十分钟；想安静走也可以。", 15, "slow", "并肩走一小段就够"),
    task("给家人留一张小纸条", "写一句真诚的感谢或祝福，放在对方容易看到的地方。", 5, "kindness", "纸条很小，心意会到"),
  ],
  "parent-child": [
    task("和孩子各用一句话接龙编故事", "你说第一句，孩子接第二句，轮流编五句。故事可以荒唐，但不能拿别人取笑。", 5, "create", "故事从一句‘有一天’开始"),
    task("让孩子教你一个游戏", "请孩子教你一个他会的游戏，认真当一次新手，玩一轮就可以。", 15, "family", "今天让小老师上场"),
    task("一起给水果起新名字", "挑一种家里有的水果，给它起个夸张新名字，再一起吃一小份。", 5, "food", "水果获得临时封号"),
    task("和孩子模仿一段电影场面", "挑一段适合孩子年龄的电影或动画场面，各演一个角色；不需要录下来。", 15, "role", "客厅临时变成片场"),
    task("一起画一张奇怪的地图", "各画一部分，做一张通往‘零食岛’或‘枕头山’的地图，画完给它命名。", 15, "create", "地图不准太像真的"),
    task("和孩子玩十秒不笑挑战", "面对面看十秒，试着不笑场。任何一方不想玩就换成互相做鬼脸。", 5, "family", "先笑的人负责选下一局"),
    task("让孩子替你选一首歌", "请孩子选一首适合你今天的歌，一起听完副歌，告诉他你想到什么。", 5, "music", "今天的片头曲由小导演决定"),
    task("一起搭一个小小枕头城堡", "用现有枕头和毯子搭个小角落，玩几分钟后一起收好。不挡通道、不爬高。", 15, "family", "城堡只开放一小会儿"),
    task("用‘因为……所以……’造句", "和孩子轮流用‘因为……所以……’造一个好笑但友善的句子，比如‘因为袜子很勇敢，所以它先去睡觉了’。", 5, "create", "两个词，把故事接起来"),
    task("一起看20分钟电视", "和孩子一起看一集适龄节目，约好看20分钟。看完互相说一个最喜欢的片段。", 15, "family", "今天的客厅小影院开场"),
    task("和孩子看一部适龄喜剧", "选一部适合孩子年龄的喜剧动画或电影，一起看一段，交换一个最好笑的瞬间。", 30, "family", "客厅小影院，笑声入场"),
  ],
  friend: [
    task("给朋友发一份《今日零食新闻》", "用主播腔发消息：‘本台刚刚发现，薯片正在认真变少。’也可以换成手边零食。", 5, "role", "友情快讯，暂无重大新闻"),
    task("玩一局石头剪刀布，输家当导演", "输家给接下来五分钟的小事配一个离谱电影名，比如‘拖鞋的逆袭’；不想玩就换个挑战。", 5, "friend", "导演预算：两只手"),
    task("给普通物品颁一个小奖", "各选一个小物件，给它颁个正经又荒唐的奖，例如‘年度最会躺平的抱枕’。", 5, "create", "获奖物品请发表感言"),
    task("互相发明一种新动物", "各用三个特征发明一种动物，例如‘会打喷嚏的云朵企鹅’，再给它起名字。", 5, "create", "动物园暂不收录"),
    task("给朋友录十秒天气预报", "一本正经播报你的心情天气：‘本地有零星想吃点心，晚些可能出现发呆。’只录自己。", 5, "role", "友情气象台已开播"),
    task("用表情描述今天", "各发三个表情或emoji描述今天，猜猜对方的‘天气’，猜错也算节目效果。", 5, "friend", "今日心情，靠图说话"),
    task("给熟悉的小事配电影旁白", "各选一件今天的小事，用史诗旁白讲一句，越日常越好笑。", 5, "role", "平凡小事，大片待遇"),
    task("设计两步庆祝动作", "一起设计一个两步就能完成的胜利动作，为‘成功找到钥匙’或‘终于喝到水’庆祝。", 5, "create", "庆祝理由可以很小"),
    task("给彼此起个奇怪头衔", "先问对方愿不愿意玩，再起友善头衔，例如‘薯片外交官’；不喜欢就换掉。", 5, "friend", "头衔仅今日有效"),
  ],
  lover: [
    task("给今天的约会起个离谱片名", "把普通小事起成电影名，比如《两个人与失踪的遥控器》，一起选最像大片的一版。", 5, "create", "主演：你们和一只遥控器"),
    task("给对方颁一个今日小奖", "互相颁一个具体又好笑的小奖；不想被评价时，可以改颁给家中物品。", 5, "kindness", "奖杯可由空气担任"),
    task("用天气预报播报心情", "双方愿意时，各用天气预报腔描述心情，比如‘局部想吃甜点’；也可以播报想象动物。", 5, "role", "亲密气象台，拒绝强行晴天"),
    task("玩三轮‘这是什么奇怪超能力’", "轮流说一个普通物品的超能力，比如杯子能让水更像水，猜猜它是什么。", 5, "friend", "超能力评审团已到场"),
    task("给家中角落写旅游介绍", "选一个角落，轮流用旅行主播口吻介绍：‘此处适合观赏一只发呆的人。’", 5, "role", "本地景点，免费入场"),
    task("交换一个无用但有趣的知识", "各说一个不影响人生、但听完会想‘哦，原来如此’的小知识；也可讲个明显是假的。", 15, "friend", "知识含量随缘，笑声优先"),
    task("给一首歌配离谱剧情", "选一首歌，各自给它编个十秒剧情，比如‘两只袜子终于重逢’。", 15, "music", "音乐短片，制作费为零"),
    task("进行一次枕头采访", "采访一个枕头：‘你怎么看最近的沙发局势？’轮流扮记者和枕头代言人。", 5, "role", "枕头拥有拒答权"),
    task("互相创作一条迷你广告", "为手边普通物品各编一句广告词，不能说它有真实不存在的功能。", 5, "create", "广告预算：一颗想象力"),
  ],
  colleague: [
    task("给今天的饮品做天气播报", "如果同事正好有空，互相用一句播报腔介绍饮品；也可以给自己的水杯播报。", 5, "role", "茶水间气象台开门"),
    task("给办公物品颁个奖", "给自己的办公物品颁友善小奖，例如‘最可靠的订书机’；不评价同事。", 5, "create", "奖品是一张想象证书"),
    task("给今天的会议起个无害片名", "会后给会议起个不涉及机密、不评价个人的轻松片名；也可以给待办清单起名。", 5, "create", "片名不进入正式纪要"),
    task("玩一轮‘猜我的午餐’", "如果对方愿意，各用三个线索猜午餐；不猜饮食习惯，忙的话就跳过。", 5, "friend", "侦探请先吃饱"),
    task("用播音腔介绍自己的水杯", "给自己的水杯做十秒产品发布会，介绍它今天的心情，不必邀请别人围观。", 5, "role", "新品发布，杯子主演"),
    task("交换一个无用但有趣的小知识", "和方便的同事各分享一个轻松小知识；没有也可以说个冷笑话。", 5, "friend", "知识不考核，冷笑话除外"),
    task("给待办清单起个冒险标题", "把自己的待办清单命名为《文件夹山脉远征》之类，不展示内容也能完成。", 5, "create", "今日任务，获得史诗配乐"),
    task("用一句话给午休做宣传", "给自己的午休写句夸张广告词，例如‘十分钟，重启人类系统’；不用打扰同事。", 5, "create", "休息时间值得拥有广告位"),
  ],
}

type Recipe = { title: (scene: string) => string; description: (scene: string) => string; duration: Duration; category: Category; verse: string }
const scenes: Record<Relationship, string[]> = {
  self: ["今天的歌单", "窗边的一束光", "手边的杯子", "一本正在读的书", "今天的天空", "一张旧照片", "今晚的晚餐", "常走的一段路", "房间里的小角落", "明天的自己"],
  family: ["家里常放的一首歌", "最近的一顿饭", "一张旧合照", "家里的一件老物品", "周末的一段空闲", "共同喜欢的零食", "一次家庭散步", "一个节日回忆", "客厅的一处角落", "最近的一件小事"],
  "parent-child": ["孩子喜欢的动画角色", "一只想象中的动物", "家里的一种水果", "一个常玩的玩具", "今天的天气", "一首熟悉的儿歌", "一个枕头城堡", "孩子画的一幅画", "一段睡前时间", "一个想象中的星球"],
  friend: ["你们共同听过的一首歌", "一段好笑的共同回忆", "一家想去的小店", "一次短暂散步", "最近发现的一种零食", "一张有趣的照片", "一个熟悉的老地方", "一部看过的电影", "一个共同认识的兴趣", "今天各自遇到的小事"],
  lover: ["你们共同喜欢的一首歌", "最近的一顿饭", "第一次约会的一个细节", "一个一起去过的地方", "彼此欣赏的一件小事", "一段安静的时间", "一张两人都喜欢的照片", "一次普通的散步", "一部想看的喜剧", "对方最近忙的一件事"],
  colleague: ["今天的茶水间", "一段通勤路", "午休的十分钟", "一件顺利完成的小事", "办公桌上的一件物品", "最近学到的一个技巧", "团队里的一次小配合", "附近的一家午餐店", "今天的天气", "一首适合下班路上听的歌"],
}

const recipes: Record<Relationship, Recipe[]> = {
  self: [
    { title: x => `给${x}起一个新名字`, description: x => `给${x}起一个只有今天有效的名字，并把它写下来或轻声念一遍。`, duration: 5, category: "create", verse: "名字一出，寻常低头" },
    { title: x => `为${x}拍一张小电影海报`, description: x => `给${x}拍一张照片，再配一个电影片名。不必修图，也不必发布。`, duration: 5, category: "photo", verse: "普通东西，主演今天" },
    { title: x => `用${x}写三行小日记`, description: x => `围绕${x}写三行今天的记录；写完就收起来，不需要写得漂亮。`, duration: 5, category: "create", verse: "三行字，也能留下回声" },
    { title: x => `给${x}配一首背景音乐`, description: x => `选一首适合${x}的歌，听完副歌，记下一个脑海里的画面。`, duration: 5, category: "music", verse: "耳朵替今天开一扇窗" },
    { title: x => `围绕${x}画一张一分钟速写`, description: x => `用一分钟画下${x}的轮廓。画得像不像都算完成，不擦掉重来。`, duration: 5, category: "create", verse: "一笔落下，今日开幕" },
    { title: x => `为${x}写一句电影旁白`, description: x => `写一句介绍${x}的电影旁白，认真或荒唐都可以，念一遍就完成。`, duration: 5, category: "create", verse: "日常忽然有了配音" },
    { title: x => `观察${x}一分钟`, description: x => `安静观察${x}一分钟，记下一个此前没留意的细节。`, duration: 5, category: "sense", verse: "停一会儿，细节就来了" },
    { title: x => `给${x}写一张未来便条`, description: x => `写一句关于${x}的提醒或祝福，留给明天的自己。`, duration: 5, category: "memory", verse: "未来的你会拆开今天" },
    { title: x => `把${x}变成一道小仪式`, description: x => `围绕${x}做一个不超过五分钟的小仪式，完成后对自己说一声收工。`, duration: 5, category: "ritual", verse: "仪式很小，日子会记得" },
    { title: x => `给${x}打一个有趣的分数`, description: x => `给${x}按今天的心情打分，再用一句话解释。分数不代表好坏。`, duration: 5, category: "slow", verse: "随手一记，也算今天" },
  ],
  family: [
    { title: x => `和家人围绕${x}互讲一段故事`, description: x => `和家人轮流讲一个与${x}有关的小片段，每人一句，讲三轮就结束。`, duration: 15, category: "family", verse: "旧话题里，长出新故事" },
    { title: x => `和家人给${x}起个家庭昵称`, description: x => `和家人一起给${x}起个友善的昵称，今天使用一次。`, duration: 5, category: "create", verse: "一个名字，家里多点笑声" },
    { title: x => `和家人用${x}做一张小照片`, description: x => `和家人围绕${x}拍一张只记录物品或场景的照片；不想拍人就不拍人。`, duration: 5, category: "photo", verse: "合照之外，也有共同记忆" },
    { title: x => `和家人分享一首关于${x}的歌`, description: x => `和家人分享一首让你想到${x}的歌，一起听完一小段。`, duration: 5, category: "music", verse: "一首歌，把两段时间接上" },
    { title: x => `和家人完成一次${x}小整理`, description: x => `和家人一起整理与${x}有关的一小处，五分钟后就停，不追求全部收完。`, duration: 5, category: "home", verse: "一起动手，事情就轻一点" },
    { title: x => `和家人给${x}做一句介绍`, description: x => `轮流用一句话介绍${x}，像在博物馆做讲解，轮到每个人一次就好。`, duration: 5, category: "role", verse: "家里的小东西，今天有展签" },
    { title: x => `和家人一起回忆${x}`, description: x => `各说一个与${x}有关的记忆，不必讲完整，也不必分享不想说的事。`, duration: 15, category: "memory", verse: "回忆不必远，桌边就有" },
    { title: x => `和家人给${x}配一个新标题`, description: x => `和家人各自给${x}想一个新标题，选最有趣的那个写下来。`, duration: 5, category: "create", verse: "换个标题，熟悉也新鲜" },
    { title: x => `围绕${x}和家人走一小段`, description: x => `和家人在安全、熟悉的地方走十分钟，把${x}当作今天的话题。`, duration: 15, category: "slow", verse: "并肩一段，已经很好" },
    { title: x => `和家人完成${x}的五分钟版本`, description: x => `选一个与${x}有关、五分钟能完成的小动作，一起做完就收工。`, duration: 5, category: "family", verse: "做小一点，也算一起完成" },
  ],
  "parent-child": [
    { title: x => `和孩子围绕${x}接龙编故事`, description: x => `你和孩子轮流说一句，把${x}编进故事里，接满六句就结束。`, duration: 5, category: "create", verse: "故事从一句‘有一天’开始" },
    { title: x => `和孩子模仿${x}`, description: x => `和孩子各模仿一次${x}，做得像不像都可以，最后一起鞠躬谢幕。`, duration: 5, category: "role", verse: "客厅临时变成片场" },
    { title: x => `和孩子给${x}配声音`, description: x => `和孩子给${x}设计一种声音或主题曲，录不录都可以，表演一次就完成。`, duration: 5, category: "create", verse: "小小配音棚开始营业" },
    { title: x => `和孩子用${x}玩三轮猜谜`, description: x => `围绕${x}各出一个简单谜语，轮流猜三轮；不会猜就揭晓答案。`, duration: 15, category: "family", verse: "谜底不重要，轮到你就好" },
    { title: x => `和孩子画出${x}的奇幻版本`, description: x => `把${x}画成会飞、会说话或住在月亮上的样子，画完给它起名字。`, duration: 15, category: "create", verse: "画纸上，一切都能发生" },
    { title: x => `和孩子为${x}设计一枚奖牌`, description: x => `用纸画一枚与${x}有关的奖牌，颁给今天最努力的人或玩具。`, duration: 15, category: "create", verse: "今日奖牌，现已颁发" },
    { title: x => `和孩子围绕${x}跳一段舞`, description: x => `放一首歌，和孩子围绕${x}自由动一小段；不需要跳得整齐。`, duration: 5, category: "family", verse: "跳错一步，刚好有趣" },
    { title: x => `和孩子做${x}的三句介绍`, description: x => `和孩子轮流说三句介绍${x}的话，最后一句必须是最好笑的一句。`, duration: 5, category: "role", verse: "小小讲解员，请上场" },
    { title: x => `和孩子把${x}变成寻宝线索`, description: x => `为${x}设计三条简单线索，在家里找一件安全的小物当宝藏。`, duration: 15, category: "adventure", verse: "宝藏就在熟悉的地方" },
    { title: x => `和孩子给${x}拍一张故事照`, description: x => `摆出${x}正在冒险的场景，只拍物品或作品，不必拍脸，再给照片取名。`, duration: 5, category: "photo", verse: "今天的主角不必是人" },
  ],
  friend: [
    { title: x => `给${x}做一条突发新闻`, description: x => `用十秒播报${x}的最新动态，越普通越好笑；只讲愿意分享的内容。`, duration: 5, category: "role", verse: "友情新闻台，偶尔播点废话" },
    { title: x => `给${x}颁一个奇怪奖项`, description: x => `给${x}颁个友善又荒唐的小奖，例如‘最会待在原地奖’；不拿别人开玩笑。`, duration: 5, category: "create", verse: "奖杯由想象力颁发" },
    { title: x => `给${x}配一个电影片名`, description: x => `把${x}改编成电影，想个夸张片名，再各说一句预告片旁白。`, duration: 5, category: "create", verse: "平凡素材，大片待遇" },
    { title: x => `把${x}变成一项迷你比赛`, description: x => `围绕${x}设计一轮不费力的小比赛，输赢不计分，对方忙就跳过。`, duration: 5, category: "friend", verse: "友谊赛只进行一小局" },
    { title: x => `给${x}设计天气预报`, description: x => `用播报腔预测${x}今天的天气，可以出现‘零星想吃点心’等奇怪天气。`, duration: 5, category: "role", verse: "气象科学暂时休假" },
    { title: x => `替${x}发明一种新动物`, description: x => `围绕${x}发明一种想象动物，说出三个特征并给它起名。`, duration: 5, category: "create", verse: "新物种登记中" },
    { title: x => `为${x}做一条迷你广告`, description: x => `给${x}想句夸张但不虚假的广告词；不拿别人开玩笑。`, duration: 5, category: "create", verse: "广告费：一声笑" },
    { title: x => `给${x}做一次枕头采访`, description: x => `把${x}当采访对象，问个荒唐问题并替它回答；不涉及真实朋友隐私。`, duration: 5, category: "role", verse: "采访对象可以是抱枕" },
    { title: x => `为${x}配一段史诗旁白`, description: x => `用旁白腔讲述${x}的一件小事，控制在两句话内，越日常越有反差。`, duration: 5, category: "role", verse: "小事也有主题曲" },
    { title: x => `和朋友为${x}画张奖状`, description: x => `画张友善、搞笑的奖状送给${x}或一件物品；不画不愿参与的人。`, duration: 15, category: "create", verse: "手绘奖状，即刻生效" },
  ],
  lover: [
    { title: x => `给${x}写一张电影海报文案`, description: x => `把${x}包装成一部喜剧片，写一句不冒犯任何人的宣传语。`, duration: 5, category: "create", verse: "主演由你们自愿出演" },
    { title: x => `给对方颁一个今日小奖`, description: x => `双方愿意时互相颁个具体小奖；也可以把奖颁给杯子或抱枕。`, duration: 5, category: "kindness", verse: "想象奖杯，不用购买" },
    { title: x => `替${x}播报一条气象`, description: x => `用夸张天气预报腔播报${x}，比如‘局部地区可能出现一只想吃点心的人’。`, duration: 5, category: "role", verse: "亲密气象台不强行放晴" },
    { title: x => `让${x}参加迷你发布会`, description: x => `选身边的小物品举办十秒发布会，轮流当主持人和物品代言人。`, duration: 5, category: "role", verse: "新品其实是旧杯子" },
    { title: x => `给${x}编一个离谱片尾`, description: x => `各为${x}编一句喜剧片尾字幕，友善轻松，谁都可以说跳过。`, duration: 5, category: "create", verse: "片尾之后，各自喝水" },
    { title: x => `为${x}设计一项友谊赛`, description: x => `设计一个不费力的小比赛，输赢不计分，双方觉得好玩才开始。`, duration: 5, category: "friend", verse: "裁判由一只想象鸭担任" },
    { title: x => `给${x}配一段纪录片旁白`, description: x => `用纪录片口吻描述一个普通瞬间；未经同意不拍摄或记录对方。`, duration: 5, category: "role", verse: "旁白请保持友善" },
    { title: x => `和对方交换一个冷笑话`, description: x => `各讲一个无害冷笑话，笑了不算输，没笑也不用补偿。`, duration: 5, category: "friend", verse: "冷场也是一种气氛" },
    { title: x => `给${x}设计一枚空气奖牌`, description: x => `想象一枚${x}主题奖牌，颁给今天最会找到遥控器的人。`, duration: 5, category: "create", verse: "奖牌重量：零克" },
    { title: x => `做十秒迷你广告`, description: x => `为${x}或家中物品各说一句夸张广告词；涉及对方时先确认对方愿意。`, duration: 5, category: "role", verse: "广告不保证提高销量" },
  ],
  colleague: [
    { title: x => `给${x}做一句天气播报`, description: x => `用播报腔描述${x}，例如‘下午局部出现想喝水的迹象’；自己完成也可以。`, duration: 5, category: "role", verse: "办公室气象，不作绩效" },
    { title: x => `给${x}起个冒险任务名`, description: x => `把自己的一个小任务命名为《寻找神秘文件夹》，不展示任务内容也能完成。`, duration: 5, category: "create", verse: "任务获得史诗感" },
    { title: x => `为${x}做一条水杯广告`, description: x => `给自己的水杯做十秒产品发布会，不夸大功能、不打扰别人。`, duration: 5, category: "role", verse: "新品发布会现在开始" },
    { title: x => `给${x}配一个无害片名`, description: x => `给自己的午休、通勤或待办清单起个喜剧片名，避免机密和个人评价。`, duration: 5, category: "create", verse: "片名仅供自己开心" },
    { title: x => `替${x}设计一枚空气奖牌`, description: x => `想象一枚${x}主题奖牌，颁给自己今天完成的一件小事。`, duration: 5, category: "create", verse: "奖杯不用占桌面" },
    { title: x => `和同事交换一个冷笑话`, description: x => `如果对方正好有空，各讲一个无害冷笑话；对方忙就自己收藏一个。`, duration: 5, category: "friend", verse: "冷笑话不进会议纪要" },
    { title: x => `给今天的茶水间写个标题`, description: x => `给自己的饮品时间取个轻松标题，例如‘人类补水维护站’，不用公开张贴。`, duration: 5, category: "create", verse: "休息也有节目名称" },
    { title: x => `给${x}安排一次迷你发布会`, description: x => `为自己的笔、键盘或文件夹做十秒发布会；不拍同事、不要求围观。`, duration: 5, category: "role", verse: "主持人和嘉宾都是你" },
  ],
}

for (const { id } of RELATIONSHIPS) {
  const generated: Task[] = []
  for (const recipe of recipes[id]) {
    for (const scene of scenes[id]) {
      generated.push(task(recipe.title(scene), recipe.description(scene), recipe.duration, recipe.category, recipe.verse))
    }
  }
  RELATIONSHIP_TASKS[id] = [...RELATIONSHIP_TASKS[id], ...generated].slice(0, 100)
}
