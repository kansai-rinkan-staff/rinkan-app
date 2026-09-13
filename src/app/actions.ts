"use server";

import { Redis } from '@upstash/redis'
import { revalidatePath } from "next/cache";

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

const redis = new Redis({
  url: redisUrl,
  token: redisToken,
})

export type ScheduleItem = { id: string; time: string; activity: string; roleNotes: { role: string; note: string; }[]; };
export type TaskItem = { id: string; name: string; deadline: string; assignee: string; memo: string; fileUrl?: string; fileUrls?: string[]; completed: boolean; };


export type Participant = {
  id: string;          
  type: 'student' | 'youth'; 
  name: string;        
  gender: string;      
  grade: string;       
  raw: any; 
  
  allocations: {
    group?: string;
    groupRole?: 'scarf' | 'leader' | null;
    studyGroup?: string;
    room?: string;
    roomRole?: 'room_leader' | null;
    car?: string;
    youthRole?: string;
    studentRole?: string;
  }
};

export type CustomBucket = {
  id: string;
  name: string;
  capacity?: number;
};

export type AppData = {
  announcement?: string;
  schedule: ScheduleItem[];
  tasks: TaskItem[];
  roles?: string[];
  taskAssignees?: string[];
  eventDates?: string[];
  startDate?: string;
  
  // Roster & Allocations
  participants?: Participant[];
  lifeGroups?: CustomBucket[];
  youthRoles?: CustomBucket[];
  studyGroups?: CustomBucket[];
  activeBuildings?: string[];
  timestamps?: Record<string, string>;
  cars?: CustomBucket[];
  studentRoles?: CustomBucket[];
};


const DEFAULT_DATA: AppData = {
  "announcement": "Googleドライブの資料から最新の行程表とタスクを自動抽出しました！",
  "roles": [
    "学生部",
    "裏方",
    "保健",
    "生活",
    "お茶",
    "飯・キャ"
  ],
  "schedule": [
    {
      "id": "s1",
      "time": "8月14日 07:30",
      "activity": "スタッフ集合",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "備品確認等"
        },
        {
          "role": "裏方",
          "note": "備品確認、車へ備品の積み込み"
        },
        {
          "role": "生活",
          "note": "1階ブルーシート引く"
        },
        {
          "role": "飯・キャ",
          "note": "荷物積み込み(中谷号)"
        }
      ]
    },
    {
      "id": "s2",
      "time": "8月14日 08:30",
      "activity": "部員集合",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "四階 貴重品、整列（女性役員）\n一階 荷物整理（男性役員）"
        },
        {
          "role": "裏方",
          "note": "1階で荷札配布、荷物整理、酔い止めの呼びかけ\n4階で貴重品の回収→先発号預かり(金下)\n→施設カギ付きロッカー"
        },
        {
          "role": "保健",
          "note": "酔い止めを飲ませる"
        }
      ]
    },
    {
      "id": "s3",
      "time": "8月14日 08:40",
      "activity": "ご挨拶、開校式",
      "roleNotes": [
        {
          "role": "保健",
          "note": "酔い止め最終確認"
        }
      ]
    },
    {
      "id": "s4",
      "time": "8月14日 09:15",
      "activity": "配車",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "体調、酔い止め"
        },
        {
          "role": "裏方",
          "note": "先発組：中谷号出発（氏神様参拝）"
        }
      ]
    },
    {
      "id": "s5",
      "time": "8月14日 09:30",
      "activity": "出発",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "法具、上履きが手荷物にあるか確認\n学年ごと固まって乗車\n車酔い不安な子は前方"
        },
        {
          "role": "裏方",
          "note": "バス乗車組：バス乗車　奥から詰める\nバス付組：バスの後ろついていく\n奈良組：大和八木集合"
        },
        {
          "role": "保健",
          "note": "バス運転手へ寸志渡す（柳田）"
        }
      ]
    },
    {
      "id": "s6",
      "time": "8月14日 10:30",
      "activity": "針到着",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "近くの部員さんの体調確認"
        }
      ]
    },
    {
      "id": "s7",
      "time": "8月14日 11:00",
      "activity": "針出発",
      "roleNotes": []
    },
    {
      "id": "s8",
      "time": "8月14日 12:00",
      "activity": "曽爾到着",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "宿舎へ移動"
        },
        {
          "role": "裏方",
          "note": "到着後、各係の動きが落ち着いたら昼食（～14:00）"
        },
        {
          "role": "生活",
          "note": "部屋割り表を貼る"
        },
        {
          "role": "飯・キャ",
          "note": "備品搬入\n懐中電灯の充電"
        }
      ]
    },
    {
      "id": "s9",
      "time": "8月14日 12:30",
      "activity": "昼食、班活動＠びょうぶ",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "荷物置き次第集合"
        },
        {
          "role": "保健",
          "note": "シーツを部屋ごとに分ける"
        },
        {
          "role": "生活",
          "note": "シーツを部屋ごとに分ける"
        }
      ]
    },
    {
      "id": "s10",
      "time": "8月14日 13:00",
      "activity": "備品受け取り",
      "roleNotes": [
        {
          "role": "生活",
          "note": "各宿泊棟階段下にゴミ袋設置"
        },
        {
          "role": "飯・キャ",
          "note": "ゴミ袋、トーチ棒（松明）受け取り"
        }
      ]
    },
    {
      "id": "s11",
      "time": "8月14日 14:00",
      "activity": "給水",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "修行＠やすらぎ（12･20･21･25番・おくじ・陀羅尼）"
        },
        {
          "role": "お茶",
          "note": "氷受け取り、びょうぶにお茶を運ぶ→お茶提供"
        },
        {
          "role": "飯・キャ",
          "note": "お茶運び手伝う"
        }
      ]
    },
    {
      "id": "s12",
      "time": "8月14日 14:45",
      "activity": "裏方企画",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "裏方企画①＠よろい（～1６:00）"
        }
      ]
    },
    {
      "id": "s13",
      "time": "8月14日 15:00",
      "activity": "昼レク＠びょうぶ",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "昼レク担当進行"
        }
      ]
    },
    {
      "id": "s14",
      "time": "8月14日 16:05",
      "activity": "裏方施設打ち合わせ",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "施設打ち合わせ(金下け・阪本智也)　＠かめやま"
        },
        {
          "role": "飯・キャ",
          "note": "飯盒の下見\n※タイミングは施設の方から連絡あり"
        }
      ]
    },
    {
      "id": "s15",
      "time": "8月14日 16:10",
      "activity": "昼レク終了（裏方企画も",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "宿舎に戻って勉強会、入浴準備"
        },
        {
          "role": "裏方",
          "note": "宿舎に戻って入浴準備→夕べの集い"
        }
      ]
    },
    {
      "id": "s16",
      "time": "8月14日 16:30",
      "activity": "夕べの集い",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "玄関集合"
        },
        {
          "role": "裏方",
          "note": "玄関集合"
        }
      ]
    },
    {
      "id": "s17",
      "time": "8月14日 17:00",
      "activity": "入浴(〜17:50)",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "裏方はお亀 or 21：30～２３：00"
        }
      ]
    },
    {
      "id": "s18",
      "time": "8月14日 17:50",
      "activity": "夕食(～18:30)",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "ナイトレクで外出る人は屋外の格好"
        },
        {
          "role": "裏方",
          "note": "夕食後、お亀の湯出発"
        },
        {
          "role": "生活",
          "note": "食後のお皿チェック"
        }
      ]
    },
    {
      "id": "s19",
      "time": "8月14日 18:40",
      "activity": "勉強会＠びょうぶ",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "給水"
        }
      ]
    },
    {
      "id": "s20",
      "time": "8月14日 19:00",
      "activity": "裏方ナイトレク準備",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "おどかし：持ち場の視察"
        },
        {
          "role": "お茶",
          "note": "氷受け取り、ナイトハイク用アクエリ用意"
        },
        {
          "role": "飯・キャ",
          "note": "お茶準備等のサポート"
        }
      ]
    },
    {
      "id": "s21",
      "time": "8月14日 19:40",
      "activity": "勉強会終了",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "おどかし：持ち場につく"
        },
        {
          "role": "生活",
          "note": "玄関で虫よけスプレー"
        },
        {
          "role": "お茶",
          "note": "ナイトレク出発前お茶提供(ペットボトルから)\nアクエリ提供(＠お亀茶屋　金下さ・栃尾)"
        }
      ]
    },
    {
      "id": "s22",
      "time": "8月14日 19:50",
      "activity": "ナイトレク",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "進行"
        },
        {
          "role": "裏方",
          "note": "おどかし：おどかす、頑張る"
        }
      ]
    },
    {
      "id": "s23",
      "time": "8月14日 21:00",
      "activity": "ナイトレク終了",
      "roleNotes": [
        {
          "role": "お茶",
          "note": "ジャグ洗い"
        }
      ]
    },
    {
      "id": "s24",
      "time": "8月14日 21:10",
      "activity": "班活動@宿舎",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "スカーフしおり回収"
        }
      ]
    },
    {
      "id": "s25",
      "time": "8月14日 21:30",
      "activity": "裏方　入浴（～23:00）",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "指導者用　入浴時間"
        }
      ]
    },
    {
      "id": "s26",
      "time": "8月14日 21:40",
      "activity": "ご挨拶",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "布団準備指導"
        },
        {
          "role": "生活",
          "note": "布団の敷き方説明（小林・森）"
        }
      ]
    },
    {
      "id": "s27",
      "time": "8月14日 21:50",
      "activity": "就寝準備",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "チーフ歯磨き、就寝準備順番振り分け"
        },
        {
          "role": "裏方",
          "note": "布団準備の手伝い"
        }
      ]
    },
    {
      "id": "s28",
      "time": "8月14日 22:00",
      "activity": "完全消灯",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "消灯後の見守り"
        },
        {
          "role": "お茶",
          "note": "翌日水筒用のお茶をやすらぎに配置"
        }
      ]
    },
    {
      "id": "s29",
      "time": "8月14日 22:30",
      "activity": "スタッフミーティング@びょうぶ",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "振り返り、翌日の行程確認"
        },
        {
          "role": "裏方",
          "note": "振り返り、翌日の行程確認"
        },
        {
          "role": "保健",
          "note": "体調不良者の共有"
        },
        {
          "role": "飯・キャ",
          "note": "キャンプファイヤーの松明の持ち方確認"
        }
      ]
    },
    {
      "id": "s30",
      "time": "8月14日 23:00",
      "activity": "",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "しおりコメント"
        },
        {
          "role": "裏方",
          "note": "見回り①　男子：金下け・進藤　女子：山脇・益田"
        }
      ]
    },
    {
      "id": "s31",
      "time": "8月14日 24:00",
      "activity": "スタッフ完全消灯",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "見回り②　男子：鈴士・中谷　女子：柳田・星加"
        }
      ]
    },
    {
      "id": "s32",
      "time": "8月15日 06:00",
      "activity": "起床",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "起床時刻前に待機\n※飯盒の格好"
        },
        {
          "role": "裏方",
          "note": "※飯盒の格好"
        }
      ]
    },
    {
      "id": "s33",
      "time": "8月15日 06:30",
      "activity": "読経",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "抜粋：前読み、２番、16番、後読み"
        },
        {
          "role": "裏方",
          "note": "抜粋：前読み、２番、16番、後読み"
        }
      ]
    },
    {
      "id": "s34",
      "time": "8月15日 07:00",
      "activity": "朝の集い",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "玄関集合（朝冷えるかも）"
        },
        {
          "role": "裏方",
          "note": "玄関集合"
        },
        {
          "role": "生活",
          "note": "食後のお皿チェック\n"
        },
        {
          "role": "飯・キャ",
          "note": "食材受け取りサポート"
        }
      ]
    },
    {
      "id": "s35",
      "time": "8月15日 07:50",
      "activity": "朝食（〜8:30）",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "しおり返却"
        }
      ]
    },
    {
      "id": "s36",
      "time": "8月15日 08:00",
      "activity": "",
      "roleNotes": [
        {
          "role": "生活",
          "note": "鍵を事務室に取りに行く、食材受取（小林・星加　）"
        },
        {
          "role": "飯・キャ",
          "note": "まき受け取り"
        }
      ]
    },
    {
      "id": "s37",
      "time": "8月15日 08:30",
      "activity": "班活動＠宿舎",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "軍手、水筒、タオル等飯盒準備"
        }
      ]
    },
    {
      "id": "s38",
      "time": "8月15日 09:30",
      "activity": "飯盒炊飯（〜11:30）＠本館上",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "青年部カレーは生活・お茶担当中心に調理"
        },
        {
          "role": "生活",
          "note": "カレーの作り方説明（星加）"
        },
        {
          "role": "飯・キャ",
          "note": "まきわり、火起こし"
        }
      ]
    },
    {
      "id": "s39",
      "time": "8月15日 10:30",
      "activity": "昼食開始（目安）",
      "roleNotes": [
        {
          "role": "生活",
          "note": "食後のお皿チェック"
        },
        {
          "role": "お茶",
          "note": "かき氷、氷の受け取り、お茶提供(食べるとき)"
        }
      ]
    },
    {
      "id": "s40",
      "time": "8月15日 11:30",
      "activity": "片付け開始",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "片付けサポート"
        },
        {
          "role": "生活",
          "note": "鍋、皿の洗いチェック"
        }
      ]
    },
    {
      "id": "s41",
      "time": "8月15日 12:20",
      "activity": "移動開始",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "可能な限り宿舎戻って着替える"
        }
      ]
    },
    {
      "id": "s42",
      "time": "8月15日 12:30",
      "activity": "班活動",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "到着次第時間まで班活動"
        },
        {
          "role": "お茶",
          "note": "びょうぶにお茶を運ぶ"
        },
        {
          "role": "飯・キャ",
          "note": "お茶運び手伝う"
        }
      ]
    },
    {
      "id": "s43",
      "time": "8月15日 13:00",
      "activity": "勉強会@びょうぶ",
      "roleNotes": []
    },
    {
      "id": "s44",
      "time": "8月15日 13:30",
      "activity": "裏方修行",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "修行＠やすらぎ（12･20･21･25番・おくじ・陀羅尼）"
        }
      ]
    },
    {
      "id": "s45",
      "time": "8月15日 14:00",
      "activity": "給水",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "裏方企画②＠よろい"
        },
        {
          "role": "お茶",
          "note": "氷受け取り→お茶提供"
        },
        {
          "role": "飯・キャ",
          "note": "♪キャンプファイヤー出し物練習"
        }
      ]
    },
    {
      "id": "s46",
      "time": "8月15日 14:10",
      "activity": "裏方　ヨガ",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "かなえちゃんヨガレッスン"
        }
      ]
    },
    {
      "id": "s47",
      "time": "8月15日 14:50",
      "activity": "裏方　勉強会",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "勉強会：「まっすぐな向上心を持とう」について"
        }
      ]
    },
    {
      "id": "s48",
      "time": "8月15日 15:00",
      "activity": "備品受け取り",
      "roleNotes": [
        {
          "role": "飯・キャ",
          "note": "キャンプファイヤーセット受け取り"
        }
      ]
    },
    {
      "id": "s49",
      "time": "8月15日 15:50",
      "activity": "勉強会終了",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "宿舎に戻って入浴準備"
        },
        {
          "role": "裏方",
          "note": "宿舎に戻って入浴準備"
        },
        {
          "role": "飯・キャ",
          "note": "やぐら立て"
        }
      ]
    },
    {
      "id": "s50",
      "time": "8月15日 16:05",
      "activity": "裏方施設打ち合わせ",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "施設打ち合わせ(金下け・阪本智也)　＠かめやま"
        }
      ]
    },
    {
      "id": "s51",
      "time": "8月15日 16:30",
      "activity": "夕べの集い",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "玄関集合"
        }
      ]
    },
    {
      "id": "s52",
      "time": "8月15日 17:00",
      "activity": "入浴(〜17:40)",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "裏方はお亀 or 21：30～２３：00"
        },
        {
          "role": "生活",
          "note": "食後のお皿チェック"
        }
      ]
    },
    {
      "id": "s53",
      "time": "8月15日 17:40",
      "activity": "夕食(〜18:20)",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "夕食後、宿舎へキャンプファイヤー準備\nその後各班びょうぶでキャンプファイヤー練習"
        },
        {
          "role": "裏方",
          "note": "夕食後、お亀の湯出発"
        }
      ]
    },
    {
      "id": "s54",
      "time": "8月15日 19:00",
      "activity": "",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "スカーフ集合　班旗着用"
        },
        {
          "role": "お茶",
          "note": "氷受け取り"
        }
      ]
    },
    {
      "id": "s55",
      "time": "8月15日 19:10",
      "activity": "玄関集合（班長・班員）",
      "roleNotes": [
        {
          "role": "お茶",
          "note": "アクエリ用意"
        },
        {
          "role": "飯・キャ",
          "note": "火の管理"
        }
      ]
    },
    {
      "id": "s56",
      "time": "8月15日 19:20",
      "activity": "キャンプファイアー@はつらつ広場",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "チーフ：キャンプファイヤー準備"
        },
        {
          "role": "裏方",
          "note": "学生部サポート\n小林(音響)、松元(動画)"
        }
      ]
    },
    {
      "id": "s57",
      "time": "8月15日 19:30",
      "activity": "歌集リクエスト",
      "roleNotes": []
    },
    {
      "id": "s58",
      "time": "8月15日 19:40",
      "activity": "休憩①",
      "roleNotes": [
        {
          "role": "お茶",
          "note": "アクエリ提供"
        }
      ]
    },
    {
      "id": "s59",
      "time": "8月15日 19:55",
      "activity": "しゅうまいじゃんけん",
      "roleNotes": []
    },
    {
      "id": "s60",
      "time": "8月15日 20:05",
      "activity": "休憩②",
      "roleNotes": [
        {
          "role": "お茶",
          "note": "アクエリ提供"
        }
      ]
    },
    {
      "id": "s61",
      "time": "8月15日 20:10",
      "activity": "マクドナルドゲーム",
      "roleNotes": []
    },
    {
      "id": "s62",
      "time": "8月15日 20:25",
      "activity": "休憩③、舞台準備",
      "roleNotes": [
        {
          "role": "お茶",
          "note": "アクエリ提供"
        }
      ]
    },
    {
      "id": "s63",
      "time": "8月15日 20:35",
      "activity": "青年部出し物",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "7分　進藤"
        }
      ]
    },
    {
      "id": "s64",
      "time": "8月15日 20:42",
      "activity": "学生部出し物",
      "roleNotes": []
    },
    {
      "id": "s65",
      "time": "8月15日 20:50",
      "activity": "キャンプファイヤー終了",
      "roleNotes": []
    },
    {
      "id": "s66",
      "time": "8月15日 21:00",
      "activity": "班活動@宿舎",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "しおり回収"
        },
        {
          "role": "お茶",
          "note": "ジャグ洗い"
        }
      ]
    },
    {
      "id": "s67",
      "time": "8月15日 21:30",
      "activity": "ご挨拶",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "翌日、シーツ回収・大掃除連絡\n裏方　入浴（～23:00）"
        }
      ]
    },
    {
      "id": "s68",
      "time": "8月15日 21:40",
      "activity": "就寝準備",
      "roleNotes": []
    },
    {
      "id": "s69",
      "time": "8月15日 22:00",
      "activity": "完全消灯",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "消灯後の見守り"
        },
        {
          "role": "お茶",
          "note": "翌日水筒用のお茶をやすらぎに配置"
        }
      ]
    },
    {
      "id": "s70",
      "time": "8月15日 22:30",
      "activity": "スタッフミーティング",
      "roleNotes": [
        {
          "role": "保健",
          "note": "体調不良者の共有"
        }
      ]
    },
    {
      "id": "s71",
      "time": "8月15日 23:00",
      "activity": "",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "しおりコメント"
        },
        {
          "role": "裏方",
          "note": "見回り①　男子：戸田・松元　女子：金下さ・丸山"
        }
      ]
    },
    {
      "id": "s72",
      "time": "8月15日 24:00",
      "activity": "スタッフ完全消灯",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "見回り②　男子：小林・阪本智也　女子：栃尾・谷川"
        }
      ]
    },
    {
      "id": "s73",
      "time": "8月16日 06:00",
      "activity": "起床",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "起床時刻前に待機\nシーツ等手伝う"
        },
        {
          "role": "裏方",
          "note": "自室のシーツ回収、やすらぎへ、学生部部屋のシーツ回収"
        },
        {
          "role": "保健",
          "note": "シーツ枚数確認"
        },
        {
          "role": "生活",
          "note": "シーツ枚数確認"
        }
      ]
    },
    {
      "id": "s74",
      "time": "8月16日 06:30",
      "activity": "読経",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "しおり返却"
        }
      ]
    },
    {
      "id": "s75",
      "time": "8月16日 07:00",
      "activity": "朝の集い",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "玄関に集合"
        },
        {
          "role": "裏方",
          "note": "玄関に集合"
        },
        {
          "role": "飯・キャ",
          "note": "キャンプファイヤーの片付け"
        }
      ]
    },
    {
      "id": "s76",
      "time": "8月16日 07:40",
      "activity": "朝食（〜8:20）",
      "roleNotes": [
        {
          "role": "生活",
          "note": "食後のお皿チェック"
        }
      ]
    },
    {
      "id": "s77",
      "time": "8月16日 08:30",
      "activity": "大掃除（トイレ掃除なし）",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "各部屋掃除チェック（金下・進藤）"
        }
      ]
    },
    {
      "id": "s78",
      "time": "8月16日 08:50",
      "activity": "移動",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "荷物持ってびょうぶへ\n※これ以降宿舎に帰りません"
        },
        {
          "role": "裏方",
          "note": "荷物持ってびょうぶへ\n※これ以降宿舎に帰りません"
        }
      ]
    },
    {
      "id": "s79",
      "time": "8月16日 09:00",
      "activity": "宿泊棟退所",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "退所手続き(金下・進藤)　＠むしとり"
        }
      ]
    },
    {
      "id": "s80",
      "time": "8月16日 09:00",
      "activity": "勉強会発表@びょうぶ",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "学年ごとに発表（6班）"
        },
        {
          "role": "裏方",
          "note": "学生部発表を後方で聞く"
        },
        {
          "role": "生活",
          "note": "発表撮影（松元）"
        }
      ]
    },
    {
      "id": "s81",
      "time": "8月16日 10:00",
      "activity": "班活動（お楽しみ会）",
      "roleNotes": [
        {
          "role": "保健",
          "note": "貴重品の返却\n酔い止め確認"
        },
        {
          "role": "生活",
          "note": "学生部へお菓子、色紙配布"
        },
        {
          "role": "お茶",
          "note": "パックジュース受取"
        },
        {
          "role": "飯・キャ",
          "note": "びょうぶブルーシート引く"
        }
      ]
    },
    {
      "id": "s82",
      "time": "8月16日 10:05",
      "activity": "裏方企画",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "裏方企画③@よろい（発表終了次第）"
        }
      ]
    },
    {
      "id": "s83",
      "time": "8月16日 11:50",
      "activity": "移動、写真撮影",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "荷物搬出"
        }
      ]
    },
    {
      "id": "s84",
      "time": "8月16日 12:00",
      "activity": "昼食@よろい",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "昼食(おにぎり)"
        },
        {
          "role": "生活",
          "note": "おにぎり受取、配布"
        }
      ]
    },
    {
      "id": "s85",
      "time": "8月16日 12:15",
      "activity": "びょうぶ完全退出",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "バス乗車組は学生より先に乗車　奥から詰める"
        },
        {
          "role": "生活",
          "note": "昼食ゴミ回収"
        }
      ]
    },
    {
      "id": "s86",
      "time": "8月16日 12:45",
      "activity": "曽爾出発",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "退所挨拶(中谷・金下)"
        }
      ]
    },
    {
      "id": "s87",
      "time": "8月16日 15:00",
      "activity": "教会到着",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "備品片付け"
        },
        {
          "role": "お茶",
          "note": "ジャグ洗い"
        }
      ]
    },
    {
      "id": "s88",
      "time": "8月16日 15:30",
      "activity": "閉校式",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "チーフ進行\nそれぞれ挨拶"
        },
        {
          "role": "裏方",
          "note": "渡：動画流す"
        }
      ]
    },
    {
      "id": "s89",
      "time": "8月16日 16:00",
      "activity": "解散",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "ドライバー：交通費清算"
        }
      ]
    }
  ],
  "tasks": [
    {
      "id": "t1",
      
      "name": "教会に資料郵送あり",
      "deadline": "",
      "assignee": "教会",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t2",
      
      "name": "希望日提出、開催日決定",
      "deadline": "",
      "assignee": "地区長",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t3",
      
      "name": "林間申込期間、申し込みフォーム作成",
      "deadline": "",
      "assignee": "会計",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t4",
      
      "name": "学生部の活動計画（案）作成",
      "deadline": "",
      "assignee": "チーフ",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t5",
      
      "name": "青年部の活動計画（案）作成",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t6",
      
      "name": "事前打ち合わせ会の依頼",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t7",
      
      "name": "利用申込書・活動計画書作成、提出",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t8",
      
      "name": "事前打ち合わせ実施(電話)",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t9",
      
      "name": "宿泊室の決定",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t10",
      
      "name": "教会の備品確認（学生部にも必要なものを確認）",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t11",
      
      "name": "青年部用のしおり、行程表作成",
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t12",
      
      "name": "備品購入",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t13",
      
      "name": "活動場所、食事、入浴時間の決定（施設問い合わせ）",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t14",
      
      "name": "食事注文書作成、提出",
      "deadline": "",
      "assignee": "会計",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t15",
      
      "name": "食物アレルギー　事前確認票の作成（学生部に依頼）",
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t16",
      
      "name": "アレルギー相談（食堂に電話）",
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t17",
      
      "name": "売店注文書作成",
      "deadline": "",
      "assignee": "会計",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t18",
      
      "name": "宿泊者名簿作成",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t19",
      
      "name": "健康調査書作成",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t20",
      
      "name": "部屋割り表作成",
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t21",
      
      "name": "清掃点検表、シーツ枕カバー確認票作成",
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t22",
      
      "name": "青年部の自家用車の確認",
      "deadline": "",
      "assignee": "会計",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t23",
      
      "name": "青年部裏方役割決め",
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t24",
      
      "name": "青年部の裏方企画の内容決め",
      "deadline": "",
      "assignee": "勉強会",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t25",
      
      "name": "センターへの手土産購入（1,500円程度）",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t26",
      
      "name": "ガソリン満タンでの依頼等",
      "deadline": "",
      "assignee": "会計",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t27",
      
      "name": "スタッフ打ち合わせ実施",
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "p1",
      
      "name": "食事・物品注文書の作成",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "p2",
      
      "name": "食物アレルギー事前確認票の作成",
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "p3",
      
      "name": "施設との事前打合せ",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "p4",
      
      "name": "宿泊利用者等名簿の提出",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "p5",
      
      "name": "入所時確認票の提出",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "p6",
      
      "name": "救急セット、体温計、おう吐処理セットの準備",
      "deadline": "当日まで",
      "assignee": "保健",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "f1",
      
      "name": "【全体】林間学校 備品リストの作成",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "f2",
      
      "name": "事前チェックシートの作成",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "f3",
      
      "name": "宿泊棟別（部屋別）記入表の作成",
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "f4",
      
      "name": "駐車許可証の作成",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "f5",
      
      "name": "【保護者アンケート】の作成",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "f6",
      
      "name": "【裏方スタッフ】アンケートの作成",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    }
  ]
};

export async function getAppData(): Promise<AppData> {
  try {
    const data = await redis.get<AppData>("rinkan_data_v8");
    return data || DEFAULT_DATA;
  } catch (e) {
    console.error("Redis Error", e);
    return DEFAULT_DATA;
  }
}

export async function saveAppData(data: AppData) {
  await redis.set("rinkan_data_v8", data);
  revalidatePath("/");
  return { success: true };
}

// --- Auth & Account Management ---
import { cookies } from 'next/headers';

export type User = { id: string; username: string; password?: string; role: string; name?: string; };
export type Settings = { viewerPassword: string };

export async function loginAsViewer(password: string) {
  try {
    if (!redisUrl) return { success: false, error: 'Redis URL (KV_REST_API_URL) が設定されていません' };
    const settings = await redis.get<Settings>("rinkan_settings_v6") || { viewerPassword: 'kansai2026' };
    if (password === settings.viewerPassword) {
      const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      await redis.set(`session_${sessionId}`, 'viewer', { ex: 60 * 60 * 24 * 7 });
      (await cookies()).set('session', sessionId, { httpOnly: true, secure: true, maxAge: 60 * 60 * 24 * 7, path: '/' });
      return { success: true };
    }
    return { success: false, error: 'パスワードが間違っています' };
  } catch (e: any) {
    return { success: false, error: 'サーバーエラー: ' + e.message };
  }
}

export async function loginAsAdmin(username: string, password: string) {
  try {
    if (!redisUrl) return { success: false, error: 'Redis URL (KV_REST_API_URL) が設定されていません' };
    let users = await redis.get<User[]>("rinkan_users_v6");
    if (!users || users.length === 0) {
      users = [{ id: 'admin_1', username: 'admin', password: 'kansai2026', role: 'admin' }];
      await redis.set("rinkan_users_v6", users);
    }
    
    const user = users.find(u => u.username === username);
    if (user && password === user.password) {
      const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      await redis.set(`session_${sessionId}`, 'admin', { ex: 60 * 60 * 24 * 7 });
      (await cookies()).set('session', sessionId, { httpOnly: true, secure: true, maxAge: 60 * 60 * 24 * 7, path: '/' });
      return { success: true };
    }
    return { success: false, error: 'IDまたはパスワードが間違っています' };
  } catch (e: any) {
    return { success: false, error: 'サーバーエラー: ' + e.message };
  }
}

export async function logout() {
  const session = (await cookies()).get('session');
  if (session) {
    await redis.del(`session_${session.value}`);
  }
  (await cookies()).delete({ name: 'session', path: '/' });
  return { success: true };
}

export async function getSessionRole() {
  const session = (await cookies()).get('session');
  if (!session) return 'none';
  const role = await redis.get<string>(`session_${session.value}`);
  return role || 'none';
}

export async function getUsers() {
  return (await redis.get<User[]>("rinkan_users_v6")) || [];
}

export async function addUser(username: string, password: string, name?: string, role: string = 'admin') {
  const users = await getUsers();
  if (users.find(u => u.username === username)) return { success: false, error: '既に存在するIDです' };
  users.push({ id: 'u' + Date.now(), username, password, role, name });
  await redis.set("rinkan_users_v6", users);
  revalidatePath('/');
  return { success: true };
}

export async function deleteUser(id: string) {
  let users = await getUsers();
  if (users.length <= 1) return { success: false, error: '最後の管理者は削除できません' };
  users = users.filter(u => u.id !== id);
  await redis.set("rinkan_users_v6", users);
  revalidatePath('/');
  return { success: true };
}

export async function updateViewerPassword(newPassword: string) {
  await redis.set("rinkan_settings_v6", { viewerPassword: newPassword });
  return { success: true };
}

export async function generateInviteToken(role: 'admin' | 'editor' = 'admin') {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  await redis.setex('invite_' + token, 24 * 60 * 60, role); // 24 hours
  return token;
}

export async function checkInviteToken(token: string) {
  const role = await redis.get<string>('invite_' + token);
  return role ? role : null;
}

export async function registerWithToken(token: string, username: string, password: string, name: string) {
  const role = await checkInviteToken(token);
  if (!role) return { success: false, error: '招待リンクが無効か、期限切れです' };
  
  const res = await addUser(username, password, name, role);
  if (res.success) {
    await redis.del('invite_' + token);
  }
  return res;
}



export async function updateUser(id: string, updates: {name?: string, password?: string}) {
  let users = await getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return { success: false, error: 'ユーザーが見つかりません' };
  
  users[idx] = { ...users[idx], ...updates };
  await redis.set('rinkan_users_v6', users);
  revalidatePath('/');
  return { success: true };
}

export async function getViewerPassword() {
  const settings = await redis.get<{viewerPassword: string}>('rinkan_settings_v6');
  return settings?.viewerPassword || 'kansai2026';
}
