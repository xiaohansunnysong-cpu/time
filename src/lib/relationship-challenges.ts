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
    task("给朋友发一首‘很像今天’的歌", "选一首歌发给朋友，只附一句：‘这首歌让我想到你。’", 5, "friend", "一首歌，替你敲敲门"),
    task("和朋友玩十秒不笑挑战", "和朋友面对面看十秒，努力不笑场；不方便见面就视频通话玩一轮。", 5, "friend", "先笑的人分享一个小乌龙"),
    task("问朋友一个没问过的小问题", "问：‘如果今天可以瞬间去一个地方，你选哪儿？’听完也说说你的答案。", 5, "friend", "一个问题，打开一条支线"),
    task("和朋友互相选今天的主题曲", "你们各选一首歌当对方今天的主题曲，听一首并解释为什么选它。", 15, "music", "友情临时拥有片头曲"),
    task("给朋友发一张天空照片", "拍下此刻的天空发给一位朋友，配一句你自己写的小标题。", 5, "photo", "抬头时，顺便想起你"),
    task("和朋友交换一个最近的小发现", "分享一家店、一首歌、一种零食或一条散步路线，交换彼此的推荐。", 15, "friend", "好东西不必独自收藏"),
    task("给朋友录十秒天气预报", "用一本正经的播报腔预报你今天的心情，发给熟悉的朋友。对方不方便接收就留给自己。", 5, "role", "友情气象台开始营业"),
    task("约朋友散步十五分钟", "邀请一位朋友在双方方便时散步十五分钟，不必安排特别话题。", 15, "slow", "走到哪儿，聊到哪儿"),
    task("给朋友唱一句你喜欢的歌", "先问朋友愿不愿意听，再唱一句你喜欢的歌。不想当面唱，就发一段语音；不必录对方。", 5, "music", "一句歌声，今天有了回音"),
  ],
  lover: [
    task("给对方按摩五分钟", "先问对方愿不愿意，再轻轻按摩肩膀或手部五分钟；避开疼痛部位，对方不舒服就立刻停。", 5, "kindness", "手心的温度，先问再给"),
    task("给彼此选一首歌", "各选一首最近喜欢的歌交换，听完后说说最喜欢哪一段。", 15, "music", "把没说完的话交给歌"),
    task("互相说一件欣赏的小事", "轮流说一件最近欣赏对方的小事，具体就好，不需要说得很宏大。", 5, "friend", "喜欢藏在细节里"),
    task("一起做一份简单早餐或夜宵", "用家里现有的食材一起准备一份简单吃的；任何一方累了就改成一起摆盘。", 15, "food", "两个人，一份小小菜单"),
    task("重演你们第一次约会的一分钟", "选一个轻松的小细节，用一分钟模仿第一次见面时的自己；不舒服就跳过。", 5, "role", "初见只借一分钟"),
    task("给对方写一张三行小纸条", "写三行：我记得、我喜欢、下次想和你。内容由你决定，写完交给对方。", 5, "create", "三行字，够装一小段心意"),
    task("一起闭眼听一首歌", "找舒服的位置一起听完一首歌，结束后各说一个脑海里的画面。", 5, "sense", "同一首歌，两段画面"),
    task("约一次不看手机的十分钟", "双方都愿意的话，把手机放在一边聊十分钟；不知道聊什么就各讲今天一个小插曲。", 15, "friend", "十分钟，留给眼前的人"),
    task("给对方唱一句喜欢的歌", "先问对方愿不愿意听，再唱一句喜欢的歌。对方不方便就改成互相分享歌单。", 5, "music", "把心意唱成一小句"),
  ],
  colleague: [
    task("给同事一个具体的工作感谢", "对一位同事说清楚你感谢TA帮忙的哪件小事。不需要公开夸奖。", 5, "kindness", "具体的谢谢，刚刚好"),
    task("和同事交换一首通勤歌", "问一位熟悉且方便的同事推荐一首通勤歌，也分享一首你的。", 5, "music", "今天的路多一首歌"),
    task("请同事推荐附近的午餐小店", "问一位同事附近有什么平价午餐推荐；有空就各自去试试，不必约饭。", 5, "friend", "午休地图多一个坐标"),
    task("给团队茶水间写一张友善便条", "写一句不带私人信息的轻松鼓励，放在公共区域；遵守办公室规定。", 5, "kindness", "公共角落，也能亮一下"),
    task("和同事猜今天的天气", "午休时各自猜一下今天傍晚的天气，明天再看谁猜中。", 5, "luck", "小小预测，不计绩效"),
    task("和同事互相推荐一个省时窍门", "交换一个工作或通勤中的小窍门，不涉及公司机密，也不评价彼此效率。", 5, "friend", "窍门交换所开张"),
    task("用播报腔介绍今天的咖啡或茶", "如果对方愿意，和一位熟悉的同事各用一句播报腔介绍自己的饮品。也可以自己演。", 5, "role", "茶水间新闻正在播报"),
    task("邀请同事一起走五分钟", "邀请一位同事午休时短走五分钟；对方不方便就自己绕一圈。", 15, "slow", "工作之外，走一小段"),
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
    { title: x => `把${x}分享给一位朋友`, description: x => `把与${x}有关的一首歌、一张风景或一句话发给朋友，配一个简短标题。`, duration: 5, category: "friend", verse: "一件小事，替你敲敲门" },
    { title: x => `和朋友模仿${x}的电影场面`, description: x => `和朋友用十秒模仿${x}的电影场面，不拍对方也可以，演完一起收工。`, duration: 5, category: "role", verse: "友情临时拥有片场" },
    { title: x => `给朋友唱一句关于${x}的歌`, description: x => `围绕${x}给朋友唱一句你喜欢的歌，并把自己录下来发给对方；不用录对方。`, duration: 5, category: "music", verse: "一句歌声，今天有了回音" },
    { title: x => `和朋友给${x}起一个外号`, description: x => `和朋友给${x}起一个无伤大雅的外号，只给物品或共同话题起，不拿别人开玩笑。`, duration: 5, category: "create", verse: "外号一出，平常事物也会笑" },
    { title: x => `和朋友把${x}变成一分钟比赛`, description: x => `围绕${x}玩一轮一分钟小比赛，规则简单，输赢都不计较。`, duration: 5, category: "friend", verse: "友谊赛只进行一小局" },
    { title: x => `和朋友交换一段${x}记忆`, description: x => `各讲一个与${x}有关的小片段，讲完就换话题，不追问隐私。`, duration: 15, category: "memory", verse: "两段记忆，刚好碰面" },
    { title: x => `和朋友为${x}做个播报`, description: x => `和朋友用一本正经的播报腔介绍${x}，每人一句，控制在十秒内。`, duration: 5, category: "role", verse: "友情新闻台开始播报" },
    { title: x => `和朋友围绕${x}散步十分钟`, description: x => `邀请朋友在方便时围绕${x}散步十分钟；不方便就各自在心里完成。`, duration: 15, category: "slow", verse: "走到哪儿，聊到哪儿" },
    { title: x => `给朋友写一张${x}主题小卡片`, description: x => `写一句关于${x}的友善话，拍下卡片发给朋友，或下次见面交给对方。`, duration: 5, category: "kindness", verse: "一张小卡片，留住一点笑意" },
    { title: x => `和朋友做一个${x}表情`, description: x => `各自摆一个代表${x}的表情或姿势，轮流展示一次；不必拍照。`, duration: 5, category: "friend", verse: "先笑出来的人赢了" },
  ],
  lover: [
    { title: x => `给对方唱一句与${x}有关的歌`, description: x => `围绕${x}给对方唱一句你喜欢的歌，也可以录自己的声音发过去；只记录自己。`, duration: 5, category: "music", verse: "把心意唱成一小句" },
    { title: x => `和对方给${x}拍一张纪念照`, description: x => `围绕${x}拍一张照片，可只拍物品或风景；发布前确认双方都愿意。`, duration: 5, category: "photo", verse: "共同记忆，不必公开" },
    { title: x => `和对方重演${x}的一个瞬间`, description: x => `用十秒轻松重演${x}相关的小片段，双方都觉得舒服再开始，不必录制。`, duration: 5, category: "role", verse: "初见只借一分钟" },
    { title: x => `为对方准备一个${x}小惊喜`, description: x => `用手边已有的东西准备一个与${x}有关的小惊喜，不购买也能完成。`, duration: 15, category: "kindness", verse: "惊喜不必很大，刚好就好" },
    { title: x => `和对方分享一件关于${x}的小心事`, description: x => `各分享一件愿意说的、与${x}有关的小感受；不想说的内容可以留白。`, duration: 15, category: "friend", verse: "亲密也可以慢慢来" },
    { title: x => `和对方一起听完${x}主题曲`, description: x => `选一首适合${x}的歌一起听完，结束后各说一个喜欢的地方。`, duration: 5, category: "music", verse: "同一首歌，两段画面" },
    { title: x => `为对方写一句${x}专属夸奖`, description: x => `写一句具体、真诚的夸奖，内容围绕${x}，当面或发消息送给对方。`, duration: 5, category: "kindness", verse: "喜欢藏在细节里" },
    { title: x => `和对方把${x}变成约会主题`, description: x => `用家里现有物品或附近免费地点，把${x}变成一次十分钟的小约会。`, duration: 15, category: "friend", verse: "日常也可以有约会感" },
    { title: () => `给对方按摩五分钟`, description: () => `先确认对方愿意，再轻轻按摩肩膀或手部五分钟；避开疼痛部位，不舒服就停。`, duration: 5, category: "kindness", verse: "手心的温度，先问再给" },
    { title: x => `和对方给${x}写一段片尾字幕`, description: x => `各写一句给${x}的片尾字幕，认真或俏皮都可以，读给彼此听。`, duration: 5, category: "create", verse: "片尾之后，还有明天" },
  ],
  colleague: [
    { title: x => `给同事一个关于${x}的具体感谢`, description: x => `对一位同事说清楚TA在${x}相关事情上帮到你的一个细节，不必公开。`, duration: 5, category: "kindness", verse: "具体的谢谢，刚刚好" },
    { title: x => `和同事交换${x}小窍门`, description: x => `和熟悉的同事各分享一个${x}相关的小窍门，不涉及公司机密或个人评价。`, duration: 5, category: "friend", verse: "窍门交换所开张" },
    { title: x => `给团队做一条${x}播报`, description: x => `用十秒播报${x}，保持友善和工作场合合适；也可以只录自己留存。`, duration: 5, category: "role", verse: "茶水间新闻正在播报" },
    { title: x => `和同事玩一轮${x}猜谜`, description: x => `和一位熟悉的同事围绕${x}玩一轮简单猜谜，对方忙就自己写下谜底。`, duration: 5, category: "friend", verse: "小小预测，不计绩效" },
    { title: x => `给同事分享一首${x}歌单里的歌`, description: x => `把一首适合${x}的歌分享给同事，附上简短标题，不期待对方必须回复。`, duration: 5, category: "music", verse: "今天的路多一首歌" },
    { title: x => `和同事做一次${x}主题短散步`, description: x => `午休或下班时邀请同事走五分钟，把${x}当作轻松话题；不方便就独自走一圈。`, duration: 15, category: "slow", verse: "工作之外，走一小段" },
    { title: x => `给公共区域留一句${x}鼓励`, description: x => `写一句与${x}有关、适合所有人的友善便条，放在允许张贴的公共区域。`, duration: 5, category: "kindness", verse: "公共角落，也能亮一下" },
    { title: x => `和同事给${x}想个轻松标题`, description: x => `和熟悉的同事为${x}各想一个轻松标题，只评价事情或物品，不拿人开玩笑。`, duration: 5, category: "create", verse: "换个标题，熟悉也新鲜" },
    { title: x => `和同事分享一个${x}小发现`, description: x => `分享一个与${x}有关、公开且不涉及隐私的小发现，控制在一分钟内。`, duration: 5, category: "friend", verse: "好发现，顺手传递" },
    { title: x => `给自己的${x}休息时间加个仪式`, description: x => `在${x}期间停下来喝水、伸展或看远处一分钟，不影响工作安排。`, duration: 5, category: "slow", verse: "暂停一分钟，也算照顾自己" },
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
