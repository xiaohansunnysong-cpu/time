import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const TOTAL = 10000
const CHUNK = 500

const BAD =
  /酒|醉|楼顶|天台|翻越|尾随|跟踪|搭讪|要电话|要微信|外貌|身材|吓人|整蛊|裸|偷窃|闯红灯|偏僻|网贷|借钱|奢侈|假扮工作人员|谣言|危险|半夜出门|陌生人家里|翻墙|攀爬|药品|处方|加微信|http|www\./

function chars(text) {
  return Array.from(text).length
}

function balanced(text) {
  const open = (text.match(/「/g) ?? []).length
  const close = (text.match(/」/g) ?? []).length
  return open === close
}

function acceptable(slip) {
  const all = `${slip.verse}${slip.title}${slip.description}`
  if (!balanced(all)) return "括号不成对"
  if (BAD.test(all)) return "触及不宜"
  if (/的的|了了|在在|把把|给给|先先|吃吃|喝喝|undefined|null|\{|\}/.test(all)) return "语句别扭"
  if (
    /路朝|路沿|路绕着|轻声留|新闻名字|考古名字|默片名字|日记名字|天气预报名字|相声名字|菜谱名字|就夸把|拨出的十五分钟，|然后起一个|然后用一句话形容[^它]|然后在心里鞠躬|玩「用|雨或晴|下一个一声|用严肃口吻|用童话口吻|一小段，/.test(
      all,
    )
  ) {
    return "语句别扭"
  }
  if (chars(slip.title) < 6 || chars(slip.title) > 46) return "标题长短"
  if (chars(slip.description) < 16 || chars(slip.description) > 120) return "说明长短"
  if (!slip.description.includes("。")) return "说明不成句"
  if (chars(slip.verse) < 4 || chars(slip.verse) > 22) return "签语长短"
  if (/[A-Za-z]/.test(all)) return "夹了字母"
  return ""
}

function mulberry32(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(list, rng) {
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1))
    const current = list[index]
    list[index] = list[swap]
    list[swap] = current
  }
  return list
}

function hash(text) {
  let value = 2166136261
  for (const char of text) {
    value ^= char.codePointAt(0) ?? 0
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

function combos(slots, build) {
  const keys = Object.keys(slots)
  const out = []
  const walk = (index, acc) => {
    if (index === keys.length) {
      out.push(build(acc))
      return
    }
    const key = keys[index]
    for (const value of slots[key]) walk(index + 1, { ...acc, [key]: value })
  }
  walk(0, {})
  return out
}

const VERSE = {
  ritual: [
    "名字一出，寻常低头",
    "郑重一声，日子侧身",
    "叫过的事物，会记住你",
    "一口头衔，万般平常",
    "宣布之后，晚饭有了江湖",
    "封号很小，回声很大",
    "把今天叫醒",
    "寻常物，听得见自己的名字",
  ],
  rule: [
    "规则一弯，路就歪了",
    "这一小时，另有语法",
    "四字够用，世界变轻",
    "怪规则只活一小会儿",
    "按歪了的节拍走路",
    "自己跟自己签的约",
    "下一分钟可以重来",
    "不合常理，刚刚好",
  ],
  stranger: [
    "一句具体的好，比空话近",
    "夸到细节，人才被看见",
    "说完就走，余温还在",
    "轻轻的，才放得下",
    "柜台那边，会亮一下",
    "不留名字，留一句准",
    "善意要小，才好接住",
    "谢谢说得见物",
  ],
  secret: [
    "纸条不署名，角落会笑",
    "未来的你会拆开今天",
    "藏好，就算寄出",
    "一句好话，自己会走路",
    "匿名，是一种礼貌",
    "七天后的手会摸到",
    "不留地址，只留温度",
    "悄悄的，也算完成",
  ],
  explore: [
    "没走过的路，认得新脚步",
    "宝物不必带走",
    "拐一下，城市就开口",
    "熟悉之前，先陌生一会儿",
    "步数比地图诚实",
    "小街不在地图上",
    "走到熟悉处，就可以停",
    "偏航是今天的正文",
  ],
  role: [
    "身份借一会儿，记完就还",
    "地球人的认真，值得记录",
    "考察结束，恢复原样",
    "月亮今晚微服",
    "只观察，不打扰",
    "三件小事，就是报告",
    "扮演到门口为止",
    "外星人也要守规矩",
  ],
  create: [
    "三件东西，已经是展览",
    "名字比形状先到",
    "摆好，看一分钟",
    "说明牌让日常站直",
    "不买道具，用手边的",
    "小小的，也算建成",
    "归位之后，名字还在",
    "今天的博物馆只开一分钟",
  ],
  luck: [
    "下一个颜色，替你拿主意",
    "命运只负责小事",
    "红的那件，点了今晚",
    "听它一次，然后自己笑",
    "手势来了，就偏一下",
    "不合适，就向颜色道谢",
    "硬币比计划更会迷路",
    "这一下，不算吉凶",
  ],
  kindness: [
    "弯一次腰，路就轻一点",
    "具体的谢，最轻也最真",
    "放回原处，也是悄悄的好",
    "不必声张",
    "顺手的，才算这支签",
    "让下一个人省一步",
    "善意要能立刻做完",
    "做小一点，仍然算数",
  ],
  adventure: [
    "委托很小，做完即回",
    "秘密任务，公开安全",
    "找到就停，不必扩大",
    "城市把线索放得很低",
    "看一眼，就算抵达",
    "不进私人的门",
    "这单委托，免费",
    "回来时口袋里有一句",
  ],
  family: [
    "谁先笑，谁就赢一点",
    "指挥权只借三分钟",
    "家里也可以出城",
    "一个人，就分饰两角",
    "游戏结束，要说收工",
    "枕头城堡也算建成",
    "晚饭之前的一小场",
    "规则可笑，人才放松",
  ],
  food: [
    "先闻再咬，时间变厚",
    "这口有名字了",
    "仪式很小，味道会排队",
    "宣布之后再入口",
    "不赶，才吃得见",
    "剩菜也可以封神",
    "一小口，算一场",
    "热气是今天的路",
  ],
  sense: [
    "气味不排队，直接进记忆",
    "五个字，刚刚好",
    "闭上眼，世界换耳朵",
    "外号一出，味道就站住",
    "先闻，再决定要不要",
    "这一下，交给鼻子",
    "声音也要有名字",
    "手比眼睛先到",
  ],
  slow: [
    "慢到可笑，街景才说话",
    "这一小段不赶",
    "肩膀先到家",
    "允许只做一点点",
    "五分钟不被使用",
    "今天可以请假",
  ],
  city: [
    "门推开的一下，已经是旅行",
    "橱窗也算到过",
    "问一句，地图裂开",
    "早一站，路换了主人",
  ],
  home: [
    "屋里也有远方",
    "归位，是一种让",
    "这件东西今天值班",
  ],
}

const MISCHIEF = [
  "小逆一签，专管有趣",
  "这支不主吉凶，只主偏航",
  "下签也发光，只是斜着",
  "歪一点，故事才开始",
  "不算吉利，刚刚好顽皮",
  "这签故意有点歪",
]

const RANKS = ["上上签", "上签", "中签", "下签"]

function rankFor(n) {
  const slot = n % 10
  if (slot === 0) return "下签"
  if (slot <= 3) return "上上签"
  if (slot <= 6) return "上签"
  return "中签"
}

function verseFor(category, title, rank) {
  if (rank === "下签") return MISCHIEF[hash(title) % MISCHIEF.length]
  const bank = VERSE[category] ?? VERSE.ritual
  return bank[hash(title) % bank.length]
}

function durationFor(category, n) {
  if (category === "explore" || category === "adventure") return n % 3 === 0 ? 30 : 15
  if (category === "ritual") return n % 2 === 0 ? 15 : 5
  if (category === "sense" || category === "luck" || category === "stranger" || category === "kindness") {
    return 5
  }
  return 15
}

const jewels = [
  {
    category: "ritual",
    duration: 5,
    verse: "宣布之后，晚饭有了江湖",
    title: "给今天的晚饭起一个武侠名字，并郑重宣布",
    description:
      "名字要具体，最好带上一件器物或一种天气。只宣布一次，对自己或同桌说也算，然后照常开吃。",
  },
  {
    category: "rule",
    duration: 15,
    verse: "四字够用，世界变轻",
    title: "接下来一小时，说话只用四个字",
    description:
      "四个字一句，多了就停下来重说。做不到就笑一下再来。只约束自己，不必向别人解释这是签。",
  },
  {
    category: "stranger",
    duration: 5,
    verse: "夸到细节，人才被看见",
    title: "轻轻夸一位店员把东西摆齐的样子",
    description:
      "说一句具体的、让人舒服的话，夸的是手上的事，不是长相。说完道谢就走，不问名字，不留联系方式。",
  },
  {
    category: "secret",
    duration: 15,
    verse: "纸条不署名，角落会笑",
    title: "在公共留言处留一张写着好话的匿名纸条",
    description:
      "写「今天的你已经很好」或一句同样轻的话。不署名，不留联系方式，不挡路。放好就走。",
  },
  {
    category: "explore",
    duration: 15,
    verse: "宝物不必带走",
    title: "走一条从没走过的路回家，并找到一个宝物",
    description:
      "宝物可以是一片怪叶子、一块好看的砖或一句招牌。看清它，在心里登记，不必带走。走到熟悉的地方就结束。",
  },
  {
    category: "role",
    duration: 15,
    verse: "三件小事，就是报告",
    title: "假装自己是来地球考察的外星人，记录三件奇怪的人类行为",
    description:
      "写在纸上或备忘录里。只观察，不打扰，不拍别人的脸。记完把身份交还，恢复成地球人。",
  },
  {
    category: "create",
    duration: 15,
    verse: "三件东西，已经是展览",
    title: "用手边三样东西摆一个小雕塑，并给它起名",
    description:
      "不另外买东西。摆好看一分钟，把名字念出来。然后各自放回原处，展览闭馆。",
  },
  {
    category: "luck",
    duration: 5,
    verse: "红的那件，点了今晚",
    title: "下一个看到的红色东西，决定你今晚吃什么的一个小选择",
    description:
      "让红色只决定一件免费、马上能做的小事，比如加不加葱、喝热的还是常温。不合适就向红色道谢，改由你选。",
  },
  {
    category: "rule",
    duration: 15,
    verse: "按歪了的节拍走路",
    title: "把每一扇普通的门当成关卡，经过时在心里通关",
    description:
      "不必出声。通关词可以是四个字。走到家或到你愿意停的那一扇为止。",
  },
  {
    category: "ritual",
    duration: 5,
    verse: "一口头衔，万般平常",
    title: "给自己的影子封一个座位，请它先坐",
    description:
      "找一处有光的地方，看影子落在哪。在心里把那块地面让给它一会儿，你再坐下或走开。",
  },
  {
    category: "family",
    duration: 15,
    verse: "指挥权只借三分钟",
    title: "和家人交换三分钟指挥权，你只照做一件小事",
    description:
      "三分钟到了就停，并谢谢指挥官。只有自己，就让一只玩偶发号施令，你照做一件无害的小事。",
  },
  {
    category: "family",
    duration: 15,
    verse: "谁先笑，谁就赢一点",
    title: "把一首熟歌改两个字，唱给自己或家人",
    description:
      "儿歌、老歌或广告调都可以。唱完就可以笑，不必录下来，也不必发给别人。",
  },
  {
    category: "sense",
    duration: 5,
    verse: "声音也要有名字",
    title: "闭眼听满一分钟，给三种声音起外号",
    description:
      "就地站着或坐着。睁开眼立刻写下三个外号。外号可以很离谱，只要你自己听得懂。",
  },
  {
    category: "luck",
    duration: 5,
    verse: "硬币比计划更会迷路",
    title: "用一枚硬币决定下一个路口，走五分钟再原路返回",
    description:
      "只在安全的人行道上玩。硬币不管红灯，你自己管。五分钟到了就回头，不必走到陌生的深处。",
  },
  {
    category: "secret",
    duration: 15,
    verse: "未来的你会拆开今天",
    title: "给七天后的自己写一句，藏进一本书里",
    description:
      "只写一件你希望那时还记得的小事。藏好就忘掉它，让以后的自己遇见。",
  },
  {
    category: "ritual",
    duration: 5,
    verse: "叫过的事物，会记住你",
    title: "出门或回家时，对鞋子说一句辛苦了",
    description:
      "声音可以小到只有鞋听见。说完把它们放正。这就是今天的闭幕或开场。",
  },
  {
    category: "food",
    duration: 15,
    verse: "剩菜也可以封神",
    title: "给冰箱里现有的一样吃的起一个仙侠名字，吃的时候宣布",
    description:
      "不额外买。名字要像样，比如带上一座山或一阵风。宣布完就吃，吃完把盒子归位。",
  },
  {
    category: "role",
    duration: 15,
    verse: "月亮今晚微服",
    title: "假装自己是微服的月亮，记下三件人类对灯光的郑重",
    description:
      "路灯、台灯、橱窗都行。只看，不打扰别人。用三句话写完，月亮就下班。",
  },
  {
    category: "create",
    duration: 15,
    verse: "小小的，也算建成",
    title: "用杯子、钥匙和一张纸摆一座桌面山脉，并给它起名",
    description:
      "就这三样，不买新的。看一分钟，把名字念出来，再把它们放回原位。",
  },
  {
    category: "luck",
    duration: 5,
    verse: "手势来了，就偏一下",
    title: "下一声鸟叫、门铃声或碗碰碗，就去喝一杯水",
    description:
      "把那个声音当成命运的手势。水是免费的那一杯。若一直没有声音，就以你的下一次哈欠为准。",
  },
  {
    category: "rule",
    duration: 15,
    verse: "自己跟自己签的约",
    title: "走路时把每把伞看成帆，在心里祝它们顺风",
    description:
      "不评论别人，只在心里说。看到第三把，或走到你该停的地方，这支签就完成。",
  },
  {
    category: "family",
    duration: 15,
    verse: "晚饭之前的一小场",
    title: "问家人一个从没问过的小问题：小时候最喜欢哪种声音",
    description:
      "问完就听，不评价。只有自己，就把问题写下来，并替小时候的自己答一句。",
  },
  {
    category: "create",
    duration: 15,
    verse: "名字比形状先到",
    title: "把一句抱怨翻译成夸张的诗，写在纸上然后揉掉",
    description:
      "两行就够，不必押韵。写完揉成一团扔掉或收进废纸。抱怨完成任务后就可以下班。",
  },
  {
    category: "city",
    duration: 15,
    verse: "问一句，地图裂开",
    title: "进一家没进过的小店，只问一个不花钱的问题",
    description:
      "问一件具体的小事，比如某种面包几点出炉。道谢后离开，不必买。",
  },
  {
    category: "ritual",
    duration: 5,
    verse: "把今天叫醒",
    title: "给今天的运气起一个四字名字，写在掌心再握上",
    description:
      "四个字，可以很好笑。握十秒，然后去洗手或直接开始下一件事。名字不必告诉别人。",
  },
  {
    category: "family",
    duration: 15,
    verse: "家里也可以出城",
    title: "和孩子或自己比赛，谁先找到三件圆形的东西",
    description:
      "找到就停，排成一排看一眼。不必收拾出成果，圆的东西各回各处。",
  },
  {
    category: "explore",
    duration: 15,
    verse: "偏航是今天的正文",
    title: "把回家的路走成电影片头，慢到自己想笑",
    description:
      "大约十分钟。只看招牌、树和光，不看手机。走到熟悉的地方，片头结束。",
  },
  {
    category: "kindness",
    duration: 5,
    verse: "具体的谢，最轻也最真",
    title: "对一位正在做事的人说一句点明事情的谢谢",
    description:
      "收银、骑手、保洁或同事都可以。说清你谢的是哪一件。没有机会，就给同住的人倒一杯水。",
  },
  {
    category: "secret",
    duration: 5,
    verse: "一句好话，自己会走路",
    title: "在公告栏边角留一句不署名的好话",
    description:
      "写得具体、善意、很短。不挡通知，不留联系方式。贴好或压好就离开。",
  },
  {
    category: "slow",
    duration: 5,
    verse: "允许只做一点点",
    title: "把手机扣下，直到你慢数到三十",
    description:
      "数错了不必重来，从你记得的地方继续。数完再把手机翻开，或者先去做一件更慢的事。",
  },
  {
    category: "food",
    duration: 15,
    verse: "先闻再咬，时间变厚",
    title: "把家里现有的一小口吃的吃成仪式：先闻三秒，再起名",
    description:
      "不额外买。名字四个字以内。吃的时候不看手机，吃完用一句话留下余味。",
  },
  {
    category: "adventure",
    duration: 15,
    verse: "看一眼，就算抵达",
    title: "去一家没进过的橱窗前站一分钟，只挑一件你愿意记住的",
    description:
      "不必进门，不必购买。把那一件用一句话写下来或记在心里，然后离开。",
  },
  {
    category: "home",
    duration: 5,
    verse: "这件东西今天值班",
    title: "给今天的钥匙一个临时头衔，出门时叫它一声",
    description:
      "头衔四个字。叫完就装进口袋。回来若还记得，就免去它的职务。",
  },
  {
    category: "sense",
    duration: 5,
    verse: "五个字，刚刚好",
    title: "找到一种近处的气味，用刚好五个字形容",
    description:
      "肥皂、书页、茶、雨或厨房都可以。五个字不必成句。说出来或写下来，这支签就齐了。",
  },
]

const frames = []

frames.push({
  category: "ritual",
  items: combos(
    {
      object: [
        "今天的晚饭",
        "手里的杯子",
        "窗外那朵云",
        "门口那双鞋",
        "桌上的钥匙",
        "今天的风",
        "包里的伞",
        "刚洗好的碗",
        "窗台的花",
        "今晚的月亮",
        "路上的影子",
        "口袋里的硬币",
        "刚买的面包",
        "等车的这几分钟",
        "厨房的香气",
        "今天的光",
        "你坐的椅子",
        "楼道的回声",
        "那盏路灯",
        "今天的天色",
        "手里的笔",
        "冰箱里的剩菜",
        "阳台的衣服",
        "这一页空白",
        "耳机里的歌",
        "路口的红灯",
        "刚泡的茶",
        "晚饭的碗",
        "窗边那只鸟",
        "口袋里的收据",
        "今天的自己",
        "这段楼梯",
        "你的背包",
        "今晚的枕头",
        "这页日历",
        "牙刷杯",
        "水龙头",
        "这条围巾",
        "楼下的信箱",
        "你的脚步",
      ],
      style: [
        "武侠小说",
        "仙侠话本",
        "童话",
        "评书",
        "侦探小说",
        "航海日志",
        "科幻小说",
        "志怪故事",
        "舞台剧",
        "睡前故事",
        "民间传说",
        "寓言",
        "古诗",
        "游记",
        "旧书信",
        "相声",
        "菜谱",
        "天气预报",
        "考古报告",
        "新闻播报",
        "戏曲",
        "默片",
        "星际日志",
      ],
    },
    ({ object, style }) => ({
      category: "ritual",
      title: `用${style}的口气，给${object}起名，并郑重宣布`,
      description: `名字要具体，最好带上器物或天气。只宣布一次，声音可大可小。对自己说也算，不必叫人围观。`,
    }),
  ),
})

frames.push({
  category: "rule",
  items: combos(
    {
      window: [
        "在接下来的一小时里",
        "在接下来的二十分钟里",
        "晚饭开始之前",
        "今天日落之前",
        "下一次出门的路上",
        "在你拨出的十五分钟里",
        "在这支签之后的一小段时间里",
        "喝完下一杯之前",
        "听完三首歌之前",
        "灯还亮着的时候",
        "回到家门口之前",
        "在下一趟短短的通勤里",
        "买完下一件小东西之前",
        "在今天结束之前",
        "在坐下之前的那段路上",
      ],
      constraint: [
        "说话只用四个字",
        "每句话都带一种颜色",
        "把「然后」说成「忽然」",
        "开口前先在心里鞠躬",
        "只用问句跟自己说话",
        "看见圆形就在心里鼓掌",
        "看见红色就点一下头",
        "给经过的每扇门起个临时名字",
        "走路时哼一段没有歌词的调",
        "把谢谢说成一件具体的小事",
        "做完一个小动作就在心里说好",
        "把今天叫作远客来的一天",
        "回答自己之前先说天气",
        "只用左手拿起小东西",
        "把叹气换成轻轻吹一口气",
        "看见云就给它起小名",
        "把「我要」换成「我邀请」",
        "给听到的第一种声音起外号",
        "把普通的门叫作关卡",
        "每走十步就看一次天空",
        "把杯子举到光里再喝",
        "说话时带一个食物的比喻",
        "给此刻起一个时间的别名",
        "假装每件小东西都在值班",
        "把「快点」从心里删掉",
        "看见字就只读四个字",
        "给自己的步伐配一个鼓点",
        "把背包看成小小的飞船",
        "把每扇窗当画，只看两秒",
        "把钥匙叫作今日令牌",
        "对鞋子说一句辛苦了",
        "把等待当成收集声音",
        "用四个字给心情起名",
        "看见鸟或植物就在心里问好",
        "把抱怨翻译成一句夸张的诗",
        "给影子安排一个座位",
      ],
    },
    ({ window, constraint }) => ({
      category: "rule",
      title: `${window}，${constraint}`,
      description: `这条规则只约束你自己：${constraint}。做不到就笑一下，从下一分钟重来，不必解释，也不必坚持到不舒服。`,
    }),
  ),
})

frames.push({
  category: "stranger",
  items: combos(
    {
      person: [
        "店员",
        "收银的人",
        "面包店里的人",
        "花店里的人",
        "书店店员",
        "咖啡店里的人",
        "药店里的人",
        "超市里理货的人",
        "水果摊的人",
        "邮局里的人",
        "打印店里的人",
        "菜场里的人",
        "车站里答问的人",
        "前台的人",
        "花摊边的人",
        "文具店里的人",
      ],
      detail: [
        "做事时的耐心",
        "东西摆得很齐的样子",
        "说话清楚、又不催人",
        "给别人留出的那一点空",
        "擦得发亮的柜台",
        "回答小问题时的认真",
        "递袋子时稳稳的手势",
        "收拾整齐的门口",
        "写得工整的价签",
        "轻声说谢谢的样子",
        "放得很稳的找零",
        "让人不用大声的音量",
        "随手把东西归位的习惯",
        "窗边那盆被照顾的植物",
        "工作服上一个很小的饰物",
        "招呼队伍时的从容",
        "折得很整齐的包装角",
        "提醒小心烫时的轻声",
        "放得很轻的店里音乐",
        "放得很正的门口垫子",
      ],
    },
    ({ person, detail }) => ({
      category: "stranger",
      title: `轻轻夸一位${person}，就夸${detail}`,
      description: `说一句具体的、让人舒服的话，夸的是事情，不是长相。说完道谢离开，不问姓名，不留任何联系方式。`,
    }),
  ),
})

frames.push({
  category: "secret",
  items: combos(
    {
      place: [
        "书店的读者墙",
        "咖啡馆留言板",
        "社区布告栏边角",
        "图书馆的便签墙",
        "电梯便民贴旁边",
        "自习室公共桌角",
        "社区活动室门口",
        "允许留言的小黑板",
        "公园告示栏边角",
        "公寓大堂公告栏",
        "共享书桌的一角",
        "面包店的留言夹里",
        "美术馆的意见簿",
        "车站便民栏上",
        "校园布告栏边角",
        "社区厨房的留言处",
        "书店楼梯口的墙上",
        "咖啡馆窗台的卡片盒里",
        "公共休息室的软木板",
        "展览说明旁的便签条",
      ],
      line: [
        "今天的你已经很好",
        "你走过的路都算数",
        "有人悄悄为你高兴",
        "慢慢来也算到达",
        "谢谢你把日子过得认真",
        "你比自己以为的更温柔",
        "世界今天偏爱你一点点",
        "你的小认真被看见了",
        "允许自己歇一会儿",
        "今天不必完美",
        "有人把好运分你一点",
        "这页日子写得不错",
        "谢谢你没有放下今天",
        "你已经足够好了",
        "把温柔留给刚好需要的人",
        "今天的风站在你这边",
        "你做的小事有人受益",
        "愿你遇见一盏不刺眼的灯",
        "你值得一杯热的",
        "路还在，你也在",
        "谢谢你让公共的地方舒服一点",
        "今天可以只做一点点",
        "你不是一个人在过今天",
        "你已经很努力了",
        "愿下一顿饭热气腾腾",
        "这里借你一点好运",
        "辛苦了，仍然值得",
        "把这句话送给刚好抬头的人",
      ],
    },
    ({ place, line }) => ({
      category: "secret",
      title: `在${place}留一张匿名纸条：「${line}」`,
      description: `不署名，不留联系方式，不挡住别人要看的通知。纸条放在抬眼能看见的地方，写完就走，不必等谁捡到。`,
    }),
  ),
})

frames.push({
  category: "explore",
  items: combos(
    {
      way: [
        "走路回家",
        "走路去买菜",
        "出门散一会儿步",
        "一直走到车站",
        "朝着公园走",
        "先朝面包店走，再回头",
        "朝着邮局走",
        "朝着有水的地方走",
        "朝着树多的地方走",
        "朝着更安静的地方走",
        "沿着有店的一侧走",
        "沿着安静的一侧走",
        "绕这个街区走一圈",
        "走到下一个陌生路口就停",
        "先去看一扇橱窗，再折返",
        "改走对面的一侧",
      ],
      treasure: [
        "一块好看的砖",
        "一句有趣的招牌",
        "一扇从没注意的门",
        "一株从缝里长出的小植物",
        "一种说不清的气味",
        "一个圆形的物件",
        "一盏先亮起来的灯",
        "一面有纹路的墙",
        "一个清楚的倒影",
        "一片形状奇怪的叶子",
        "一个被放得很整齐的角落",
        "一种占了上风的颜色",
        "一颗可以当宝物的小石子",
        "一扇反光的窗",
        "一段好听的环境声",
        "一个安全的新方向",
        "一只不怕人的鸟或它的影子",
        "一块被磨亮的地面",
        "四个可以当诗的字",
        "一个让你想微笑的细节",
      ],
    },
    ({ way, treasure }) => ({
      category: "explore",
      title: `今天换一条路，${way}，找到「${treasure}」`,
      description: `宝物不必带走，看清它，在心里或纸上登记一句。只走安全的路，走到熟悉的地方就可以结束。`,
    }),
  ),
})

frames.push({
  category: "role",
  items: combos(
    {
      role: [
        "来地球考察的外星人",
        "迷路的时间旅客",
        "微服私访的月亮",
        "收集笑声的实习生",
        "第一次进城的云",
        "给门牌拍照的星使",
        "味道部门的外星职员",
        "影子研究所的学员",
        "温柔局的实习探员",
        "不会着急的星际邮差",
        "负责给城市起小名的人",
        "钥匙的远房朋友",
        "傍晚班的见习风",
        "只收集好事的间谍",
      ],
      behavior: [
        "奇怪的人类行为",
        "人类对杯子的郑重其事",
        "人类等待时的小动作",
        "人类和植物相处的样子",
        "人类给东西起名字的瞬间",
        "人类排队时的礼貌",
        "人类看一眼屏幕又放下",
        "人类对天气的感叹",
        "人类把包放在身侧的习惯",
        "人类遇见动物时的表情",
        "人类买面包时的犹豫",
        "人类过马路前的张望",
        "人类说谢谢的各种说法",
        "人类整理桌面的小仪式",
        "人类听歌时的脚步",
        "人类在窗边发呆的姿势",
      ],
    },
    ({ role, behavior }) => ({
      category: "role",
      title: `假装自己是${role}，记录三件${behavior}`,
      description: `写在纸上或备忘录里，只观察，不打扰，不拍摄别人的脸。记完就交还身份，不必表演给陌生人看。`,
    }),
  ),
})

const sculptureItems = [
  "杯子",
  "钥匙",
  "勺子",
  "书",
  "硬币",
  "笔",
  "瓶盖",
  "发卡",
  "橡皮",
  "筷子",
  "纸巾",
  "叶子",
  "石子",
  "夹子",
  "耳机",
  "信封",
  "便签",
  "玩偶",
  "眼镜盒",
  "充电线",
]
const sculptureNames = [
  "山雨欲来",
  "今日不宜赶",
  "慢速起飞",
  "一口江湖",
  "临时神仙",
  "小小远方",
  "安静的怪",
  "晚饭之前",
  "三件同盟",
  "桌面山脉",
  "未命名星",
  "钥匙会议",
  "软软的碑",
  "片刻纪念",
  "反向生长",
  "口袋气象",
  "无用之美",
  "今晚的船",
  "侧耳倾听",
  "刚好路过",
]
const sculptures = []
for (let i = 0; i < sculptureItems.length; i += 1) {
  for (let j = i + 1; j < sculptureItems.length; j += 1) {
    for (let k = j + 1; k < sculptureItems.length; k += 1) {
      const name = sculptureNames[(i * 7 + j * 3 + k) % sculptureNames.length]
      sculptures.push({
        category: "create",
        title: `用${sculptureItems[i]}、${sculptureItems[j]}和${sculptureItems[k]}摆一个小雕塑，起名叫「${name}」`,
        description: `就用手边这三样，不另外买。摆好看一分钟，把名字念出来，然后各自归位。`,
      })
    }
  }
}
frames.push({ category: "create", items: sculptures })

frames.push({
  category: "luck",
  items: combos(
    {
      color: ["红色", "黄色", "蓝色", "绿色", "白色", "橙色", "粉色", "紫色", "金色", "黑色"],
      decision: [
        "晚饭加不加一把家里有的葱",
        "下一杯喝热的还是常温的",
        "回家先往左还是先往右",
        "先出门五分钟还是先坐下",
        "晚饭加不加一种家里有的香料",
        "第一首歌听旧的还是随便一首",
        "哪只杯子当今晚的主角",
        "在窗边站一会儿还是换个座位",
        "先洗碗还是先发一会儿呆",
        "先给今天起名还是先给晚饭起名",
        "先写一句还是先走二十步",
        "把灯调亮一点还是调暗一点",
        "先跟家人说一句还是先安静一会儿",
        "吃一点水果还是喝一杯水",
        "用左手还是右手开下一扇门",
        "看过天再决定带不带伞",
        "先理口袋还是先喝水",
        "给植物转个面还是自己转个身",
        "走路看招牌还是看天空",
        "手机扣五分钟还是十分钟",
      ],
    },
    ({ color, decision }) => ({
      category: "luck",
      title: `让下一个${color}的东西替你拿主意：${decision}`,
      description: `让这个颜色只决定一件免费、马上能做的小事。若结果不合适，就在心里向${color}道谢，改由你自己选。`,
    }),
  ),
})

frames.push({
  category: "family",
  items: combos(
    {
      game: [
        "四字对话",
        "枕头城堡",
        "闭眼摸物",
        "晚饭武侠投票",
        "找圆形大赛",
        "改两个字唱歌",
        "三句故事会",
        "三分钟指挥权",
        "植物新闻发布会",
        "勺子话筒采访",
        "影子赛跑",
        "抱枕默剧",
        "椅子生日会",
        "地板旅行",
        "今日发现交换",
        "云和灯光投票",
        "家务关卡",
        "锅盖奖杯合影",
        "冰箱口音秀",
        "袜子里的故事",
      ],
      twist: [
        "结束时互相鞠一个很小的躬",
        "只用四个字宣布结果",
        "最后给这场游戏起标题",
        "中途夸对方一个具体细节",
        "用厨房里的东西当奖杯",
        "结束时一起看窗外十秒",
        "谁先笑谁获得一个临时头衔",
        "把过程画成三个圈",
        "做完把结果藏进纸条",
        "从开始到结束都不看手机",
        "结束时给对方倒一杯水",
        "用哼唱代替鼓掌",
      ],
    },
    ({ game, twist }) => ({
      category: "family",
      title: `和家人玩「${game}」，${twist}`,
      description: `没有家人就一人分饰两角，或把规则玩给空气看。做完说一声收工。只玩得小、玩得安全，不必拍照。`,
    }),
  ),
})

frames.push({
  category: "create",
  items: combos(
    {
      object: [
        "你的杯子",
        "一串钥匙",
        "今天的鞋",
        "这把椅子",
        "那盏灯",
        "冰箱门",
        "一把伞",
        "枕头",
        "这页日历",
        "窗台",
        "牙刷杯",
        "门把手",
        "背包",
        "耳机",
        "手边的书",
        "手机壳",
        "玄关",
        "餐桌",
        "那盆植物",
        "遥控器",
        "这条围巾",
        "水杯盖",
        "闹钟",
        "一只袜子",
        "水龙头",
        "镜子",
        "窗帘",
        "砧板",
        "信箱钥匙",
        "今天的包",
      ],
      tone: [
        "严肃的口吻",
        "童话的口吻",
        "侦探的口吻",
        "菜谱的口吻",
        "航海日志的口吻",
        "短短两句诗",
        "新闻播报的口吻",
        "武侠旁白的口吻",
        "说明书的口吻",
        "睡前故事的口吻",
        "考古报告的口吻",
        "天气预报的口吻",
        "舞台报幕的口吻",
        "日记的口吻",
        "星际日志的口吻",
        "评书的口吻",
      ],
    },
    ({ object, tone }) => ({
      category: "create",
      title: `用${tone}，为${object}写一张博物馆说明牌`,
      description: `两三句就够，写在纸上。写完念出来，好像它真的被展览了一分钟，然后把纸收好或留下。`,
    }),
  ),
})

frames.push({
  category: "adventure",
  items: combos(
    {
      place: [
        "旧书店门口",
        "面包店橱窗前",
        "公交站旁",
        "菜市场口",
        "公园长椅边",
        "楼下转角",
        "桥上",
        "超市冷门货架",
        "小区里少去的一角",
        "图书馆门外",
        "花店窗前",
        "河岸或湖边",
        "地铁出口",
        "咖啡馆窗外",
        "街角树下",
        "天桥上",
        "邮局附近",
        "社区花园",
        "药房橱窗外",
        "没走过的巷口",
      ],
      clue: [
        "一件叫不出名的小东西",
        "一句有趣的字",
        "一种今天的气味",
        "一扇没注意的门",
        "一个圆形物件",
        "一种绿色",
        "一个清楚的倒影",
        "一株努力的小植物",
        "一块特别的颜色",
        "一件摆得特别整齐的东西",
        "一面有纹路的墙",
        "一盏提前亮的灯",
        "一条墙缝里的绿",
        "一个安全的新方向",
        "一段重复的声音",
        "一个让人微笑的小细节",
      ],
      finale: [
        "在心里向它鞠一躬",
        "用一句话形容它",
        "为它拍一张没有人脸的照片",
        "给它起一个临时名字",
        "回家把它写下来",
        "对它说一声辛苦了",
        "用四个字给它封号",
        "把这件事告诉家人一句",
      ],
    },
    ({ place, clue, finale }) => ({
      category: "adventure",
      title: `秘密委托：在${place}找到${clue}，然后${finale}`,
      description: `委托很小，做完即可。不进入私人地方，不打扰别人，不花钱也算完成。找不到就换成最接近的一件。`,
    }),
  ),
})

frames.push({
  category: "luck",
  items: combos(
    {
      method: [
        "抛一枚硬币",
        "随便翻开一页，看单双",
        "看钟上的分钟是单是双",
        "听门外的声音偏左还是偏右",
        "闭眼从纸上两个词里指一个",
        "看下一扇门是开着还是关着",
        "用另一只手抽一张便签",
        "看窗外第一样会动的东西",
        "问家人二选一",
        "看下一辆车偏亮还是偏暗",
      ],
      stake: [
        "今晚家常饭的一个小选择",
        "下一杯喝什么",
        "散步时第一个转弯",
        "先做哪件五分钟的小事",
        "给谁发一句不长的问候",
        "今晚歌单的第一首",
        "哪只杯子当主角",
        "窗边站左边还是右边",
        "先出门还是先坐下",
        "灯亮一点还是暗一点",
        "先写字还是先走路",
        "把伞带上还是再看一次天",
        "先喝水还是先整理口袋",
        "给植物转面还是自己转身",
        "看招牌还是看天空",
        "手机扣五分钟还是十分钟",
      ],
    },
    ({ method, stake }) => ({
      category: "luck",
      title: `玩一次小小的命运：${method}，只让它决定${stake}`,
      description: `只把结果用在免费、马上能做的小事上。若你不喜欢那个结果，就向这次命运道谢，改由自己选，也算玩过。`,
    }),
  ),
})

const kindnessEnding = [
  "不必停留",
  "在心里记一笔",
  "对自己笑一下",
  "去喝一口水",
  "把这件事写成一句",
  "抬头看看天",
  "接着做自己的事",
  "不必告诉别人",
]
const kindnessDesc =
  "只做安全、顺手、不让对方为难的那一下。没有机会，就换成给家人或自己的最小版本，同样算完成。"
frames.push({
  category: "kindness",
  items: [
    ...combos(
      {
        place: ["店里", "车站里", "路上", "公园里", "菜场里", "咖啡馆里", "超市里", "图书馆门口"],
        act: [
          "对正在做事的人说一句具体的谢谢",
          "为后面的人扶一下门",
          "把公共椅子或推车归位",
          "捡起一小片安全的纸屑",
          "对辛苦的人说一声辛苦了",
          "把位子让给更赶时间的人",
          "给赶时间的人让出一个身位",
          "把柜台上落下的笔递回去",
          "向店员请教一件自己不知道的小事",
          "带走自己掉下的那一小片纸",
          "为下一个人把门多留一秒",
          "把挡路的公共伞收向一边",
        ],
        ending: kindnessEnding,
      },
      ({ place, act, ending }) => ({
        category: "kindness",
        title: `在${place}，${act}，然后${ending}`,
        description: kindnessDesc,
      }),
    ),
    ...combos(
      {
        act: [
          "给家里的植物浇一点水",
          "把用完的东西放回原处",
          "给同住的人留一张今天的便签",
          "把挡路的小东西轻轻挪开",
          "给家人倒一杯水",
          "把歪了的垫子铺正",
          "给很久没联系的人只发一句忽然想到你",
          "给下一个使用者留出干净的一角",
          "把玄关的鞋摆成可以进门的样子",
          "给家人的杯子倒上水",
        ],
        ending: kindnessEnding,
      },
      ({ act, ending }) => ({
        category: "kindness",
        title: `${act}，${ending}`,
        description: kindnessDesc,
      }),
    ),
  ],
})

const foodSteps = [
  "闻三秒",
  "看它的颜色",
  "对它说一句欢迎",
  "用非惯用手拿起",
  "在心里给它配乐",
  "看它在光里的样子",
  "把盘子或杯子转一下",
  "闭眼再尝很小一口",
  "说它像哪种天气",
  "给它鞠一个很小的躬",
]
frames.push({
  category: "food",
  items: [
    ...combos(
      {
        food: [
          "一瓣橘子",
          "一片面包",
          "一口米饭",
          "一块家里的点心",
          "一根黄瓜",
          "一颗葡萄",
          "一块饼干",
          "一勺酸奶",
          "今晚的第一口菜",
          "一块苹果",
          "一小把坚果",
          "一个西红柿",
          "一口面条",
          "一小块巧克力",
          "几颗花生",
          "一颗枣",
          "剩下的半份点心",
          "一碟小菜",
          "早上的第一口",
          "一片你常忽略的配菜",
        ],
        step: foodSteps,
      },
      ({ food, step }) => ({
        category: "food",
        title: `把${food}吃成小仪式：先${step}，再给它起名`,
        description: "用家里已有的，不额外买。名字四个字左右。吃的时候放下手机，吃完用一句话记下余味。",
      }),
    ),
    ...combos(
      {
        food: ["一杯茶", "一小杯热饮", "一碗汤", "一杯白水", "早上的第一口热饮"],
        step: foodSteps,
      },
      ({ food, step }) => ({
        category: "food",
        title: `把${food}喝成小仪式：先${step}，再给它起名`,
        description: "用家里已有的，不额外买。名字四个字左右。喝的时候放下手机，喝完用一句话记下余味。",
      }),
    ),
  ],
})

frames.push({
  category: "role",
  items: combos(
    {
      role: [
        "来地球考察的外星人",
        "微服的月亮",
        "迷路的诗人",
        "收集门的人",
        "味道侦探",
        "影子研究员",
        "第一次进城的风",
        "给城市起小名的人",
        "时间旅客",
        "只收集好事的间谍",
        "云的实习生",
        "不会着急的旅人",
        "见习邮差",
        "钥匙的朋友",
      ],
      mission: [
        "记下三件人类的郑重其事",
        "给三扇门起名字但不说出口",
        "找到一个可当宝物的小东西",
        "收集三种声音",
        "找一句能当诗的招牌",
        "观察人们等待的样子",
        "给沿路的树点名",
        "找一个倒影",
        "用四个字描述天空",
        "在没站过的安全空地站十秒",
        "给这条街起今天的别名",
        "找出占上风的颜色",
        "看一家没进过的店的橱窗",
        "数出三种圆形",
        "找一个让人想微笑的细节",
        "把这段路走成电影片头",
        "在心里向一盏灯报到",
        "记下一种食物的香气",
      ],
    },
    ({ role, mission }) => ({
      category: "role",
      title: `以「${role}」的身份走十分钟，任务是${mission}`,
      description: `身份只借十分钟。走安全的路，不打扰陌生人，不拍别人的脸。任务完成或时间到了，就把身份还回去。`,
    }),
  ),
})

frames.push({
  category: "secret",
  items: combos(
    {
      when: [
        "七天后的自己",
        "明天早上的自己",
        "下个雨天的自己",
        "下周的自己",
        "一个忙乱日子的自己",
        "月底的自己",
        "下个周一的自己",
        "今晚睡前的自己",
        "下次出门前的自己",
        "冬天的自己",
        "下一次旅行前的自己",
        "下个晴天的自己",
      ],
      hide: [
        "一本书里",
        "日历旁边",
        "杯子下面",
        "鞋盒里",
        "冰箱侧门",
        "枕头下",
        "镜子边",
        "外套口袋",
        "包的夹层",
        "花盆旁",
        "键盘下面",
        "常用抽屉",
      ],
      kind: [
        "一件今天的小事",
        "一句轻的鼓励",
        "一个荒谬的名字",
        "一句只有你懂的笑话",
        "一个想再做的小动作",
        "今天的天气和心情",
        "一句谢谢自己",
        "一个很轻的心愿",
      ],
    },
    ({ when, hide, kind }) => ({
      category: "secret",
      title: `写给${when}：藏在${hide}，写下${kind}`,
      description: `一两句就够。藏好之后就忘掉它，让未来的自己遇见。不必拍下来，也不必现在就读第二遍。`,
    }),
  ),
})

frames.push({
  category: "ritual",
  items: combos(
    {
      thing: [
        "今天的晚饭",
        "你的钥匙",
        "这双鞋",
        "外面的风",
        "今天的自己",
        "手里的杯子",
        "背包",
        "这把椅子",
        "窗外的树",
        "今天的光",
        "冰箱",
        "雨伞",
        "日历",
        "耳机",
        "枕头",
        "大门",
        "楼梯",
        "今天的影子",
        "口袋里的硬币",
        "那盆植物",
        "水龙头",
        "今天的歌",
        "路灯",
        "面包",
        "那朵云",
        "信箱",
        "你的脚步",
        "这条围巾",
        "这只碗",
        "今天的运气",
      ],
      occasion: [
        "晚饭桌上",
        "洗手的时候",
        "出门前",
        "关灯前",
        "泡茶时",
        "等电梯时",
        "打开门锁时",
        "坐下来的第一分钟",
        "下次看见它的时候",
        "把东西放回原位时",
        "窗边站着时",
        "收拾包的时候",
        "拉开椅子时",
        "喝第一口水时",
        "看手机之前",
        "换鞋的时候",
      ],
    },
    ({ thing, occasion }) => ({
      category: "ritual",
      title: `给${thing}封一个四字头衔，在${occasion}宣布`,
      description: `头衔要具体，可以很好笑。宣布一次就生效，声音不用大。别人不必懂，你自己要念出声。`,
    }),
  ),
})

frames.push({
  category: "luck",
  items: combos(
    {
      trigger: [
        "听到的笑声",
        "看见的狗或鸟",
        "红灯",
        "绿灯",
        "滴水声",
        "门外的风",
        "开门声",
        "鸟叫",
        "碗碰碗的声音",
        "车铃",
        "一首歌的前奏",
        "电梯的叮",
        "照到你的阳光或雨",
        "孩子的笑声",
        "手机提示音",
        "自己的哈欠",
      ],
      result: [
        "给今天起一个标题",
        "去喝一杯水",
        "往安全的方向多走二十步",
        "把肩膀放下",
        "给某人发一句短问候",
        "把手机扣下五分钟",
        "哼四个音",
        "看天空十秒",
        "对最近的植物点头",
        "把一件小东西摆正",
        "写下眼前的一个词",
        "把一件小事做得很慢",
        "给晚饭起一个荒唐名字",
        "拍一张没有人脸的照片",
        "在心里说谢谢",
        "做三次慢呼吸",
        "决定下一杯喝热的还是常温",
        "把灯调到更舒服的亮度",
      ],
    },
    ({ trigger, result }) => ({
      category: "luck",
      title: `把下一个${trigger}当作命运手势，随后${result}`,
      description: `手势来了就做那件很小的事。若一直不来，就改用你的下一次哈欠。只做稳妥、免费、马上能完成的事。`,
    }),
  ),
})

frames.push({
  category: "sense",
  items: combos(
    {
      scent: [
        "肥皂",
        "茶叶",
        "书页",
        "雨后的土",
        "橘子皮",
        "面包",
        "米饭",
        "木头",
        "洗衣液",
        "牙膏",
        "枕头",
        "铅笔",
        "一把带着潮气的伞",
        "晒过太阳的布",
        "厨房",
        "花盆里的土",
        "一杯茶",
        "刚洗的衣服",
        "门口的空气",
        "洗手台",
      ],
      form: [
        "五个字",
        "一个外号",
        "一句不像广告的话",
        "四个字的封号",
        "一个比喻",
        "一句谢谢",
        "一个童话里的身份",
        "一行不押韵的小诗",
        "一个天气比喻",
        "三个字的小菜单",
        "一个温和的封号",
        "一句只说给自己的话",
      ],
    },
    ({ scent, form }) => ({
      category: "sense",
      title: `闻一闻${scent}，用${form}把这股气味记下来`,
      description: `靠近闻一下就好，不必买。写下来或说出来。若身边没有，就换成最接近的一种气味。`,
    }),
  ),
})

function build() {
  const rng = mulberry32(20261117)
  const usedTitle = new Set()
  const out = []
  const rejected = new Map()

  const push = (partial) => {
    if (out.length >= TOTAL) return false
    if (usedTitle.has(partial.title)) return false
    const slip = {
      category: partial.category,
      title: partial.title,
      description: partial.description,
      duration: partial.duration ?? durationFor(partial.category, out.length + 1),
      rank: partial.rank ?? rankFor(out.length + 1),
      verse:
        partial.verse ??
        verseFor(partial.category, partial.title, partial.rank ?? rankFor(out.length + 1)),
    }
    if (partial.verse) slip.verse = partial.verse
    if (partial.rank) slip.rank = partial.rank
    const reason = acceptable(slip)
    if (reason) {
      rejected.set(reason, (rejected.get(reason) ?? 0) + 1)
      return false
    }
    usedTitle.add(slip.title)
    out.push(slip)
    return true
  }

  for (const jewel of jewels) push(jewel)

  const buckets = frames.map((frame) => shuffle([...frame.items], rng))
  let guard = 0
  while (out.length < TOTAL && guard < 200000) {
    guard += 1
    let moved = false
    for (const bucket of buckets) {
      while (bucket.length > 0) {
        const item = bucket.shift()
        moved = true
        if (push(item)) break
      }
      if (out.length >= TOTAL) break
    }
    if (!moved) break
  }

  if (out.length < TOTAL) {
    const reasons = [...rejected.entries()].map(([key, count]) => `${key}:${count}`).join(", ")
    throw new Error(`只生成了 ${out.length} 支。跳过原因：${reasons || "无"}`)
  }

  return {
    slips: out.slice(0, TOTAL).map((slip, index) => ({
      n: index + 1,
      rank: slip.rank ?? RANKS[index % RANKS.length],
      verse: slip.verse,
      title: slip.title,
      description: slip.description,
      duration: slip.duration,
      category: slip.category,
    })),
    rejected,
  }
}

const { slips, rejected } = build()
const titles = new Set(slips.map((slip) => slip.title))
if (titles.size !== TOTAL) throw new Error("标题有重复")
for (let n = 1; n <= TOTAL; n += 1) {
  if (slips[n - 1].n !== n) throw new Error(`签号不连续：${n}`)
}

const counts = new Map()
for (const slip of slips) counts.set(slip.category, (counts.get(slip.category) ?? 0) + 1)
const needed = ["ritual", "rule", "stranger", "secret", "explore", "role", "create", "luck", "kindness", "adventure", "family", "food"]
for (const category of needed) {
  if ((counts.get(category) ?? 0) < 200) {
    throw new Error(`${category} 只有 ${counts.get(category) ?? 0} 支`)
  }
}

const dir = resolve(root, "public/slips")
mkdirSync(dir, { recursive: true })
for (let start = 0; start < slips.length; start += CHUNK) {
  const chunk = slips.slice(start, start + CHUNK)
  const name = `chunk-${String(start / CHUNK).padStart(2, "0")}.json`
  writeFileSync(resolve(dir, name), JSON.stringify(chunk))
}
writeFileSync(
  resolve(dir, "manifest.json"),
  JSON.stringify({ total: slips.length, chunkSize: CHUNK }),
)

const sampleAt = [1, 8, 40, 200, 500, 1000, 2500, 4000, 5555, 7000, 8192, 9000, 9500, 9999, 10000]
const sampleRng = mulberry32(42)
const randomAt = new Set()
while (randomAt.size < 15) randomAt.add(1 + Math.floor(sampleRng() * TOTAL))
const samples = {
  fixed: sampleAt.map((n) => slips[n - 1]),
  random: [...randomAt].map((n) => slips[n - 1]),
  counts: Object.fromEntries(counts),
  rejected: Object.fromEntries(rejected),
}
writeFileSync(resolve(root, "scripts/slip-samples.json"), JSON.stringify(samples, null, 2))
console.log(`slips ${slips.length}`)
console.log(JSON.stringify(Object.fromEntries(counts)))
if (rejected.size) console.log(`skipped ${JSON.stringify(Object.fromEntries(rejected))}`)
