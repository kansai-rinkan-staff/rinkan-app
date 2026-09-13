/* eslint-disable */
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
  "announcement": "Googleドライブ�E賁E��から最新の行程表とタスクを�E動抽出しました�E�E,
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
      "time": "8朁E4日 07:30",
      "activity": "スタチE��雁E��",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "備品確認筁E
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
      "time": "8朁E4日 08:30",
      "activity": "部員雁E��",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "四階 貴重品、整列（女性役員�E�\n一隁E荷物整琁E��男性役員�E�E
        },
        {
          "role": "裏方",
          "note": "1階で荷札配币E��荷物整琁E��E�EぁE��め�E呼びかけ\n4階で貴重品の回収→�E発号預かめE金丁E\n→施設カギ付きロチE��ー"
        },
        {
          "role": "保健",
          "note": "酔い止めを飲ませる"
        }
      ]
    },
    {
      "id": "s3",
      "time": "8朁E4日 08:40",
      "activity": "ご挨拶、E��校弁E,
      "roleNotes": [
        {
          "role": "保健",
          "note": "酔い止め最終確誁E
        }
      ]
    },
    {
      "id": "s4",
      "time": "8朁E4日 09:15",
      "activity": "配軁E,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "体調、E�EぁE��めE
        },
        {
          "role": "裏方",
          "note": "先発絁E��中谷号出発�E�氏神様参拝！E
        }
      ]
    },
    {
      "id": "s5",
      "time": "8朁E4日 09:30",
      "activity": "出発",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "法�E、上履きが手荷物にあるか確認\n学年ごと固まって乗車\n車�EぁE��安な子�E前方"
        },
        {
          "role": "裏方",
          "note": "バス乗車絁E��バス乗車　奥から詰める\nバス付絁E��バスの後ろつぁE��ぁE��\n奈良絁E��大和�E木雁E��"
        },
        {
          "role": "保健",
          "note": "バス運転手へ寸志渡す（柳田�E�E
        }
      ]
    },
    {
      "id": "s6",
      "time": "8朁E4日 10:30",
      "activity": "針到着",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "近くの部員さんの体調確誁E
        }
      ]
    },
    {
      "id": "s7",
      "time": "8朁E4日 11:00",
      "activity": "針�E発",
      "roleNotes": []
    },
    {
      "id": "s8",
      "time": "8朁E4日 12:00",
      "activity": "曽爾到着",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "宿舎へ移勁E
        },
        {
          "role": "裏方",
          "note": "到着後、各係�E動きが落ち着ぁE��ら昼食（ａE4:00�E�E
        },
        {
          "role": "生活",
          "note": "部屋割り表を貼めE
        },
        {
          "role": "飯・キャ",
          "note": "備品搬入\n懐中電灯の允E��"
        }
      ]
    },
    {
      "id": "s9",
      "time": "8朁E4日 12:30",
      "activity": "昼食、班活動＠びめE��ぶ",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "荷物置き次第雁E��"
        },
        {
          "role": "保健",
          "note": "シーチE��部屋ごとに刁E��めE
        },
        {
          "role": "生活",
          "note": "シーチE��部屋ごとに刁E��めE
        }
      ]
    },
    {
      "id": "s10",
      "time": "8朁E4日 13:00",
      "activity": "備品受け取り",
      "roleNotes": [
        {
          "role": "生活",
          "note": "吁E��泊棟階段下にゴミ袋設置"
        },
        {
          "role": "飯・キャ",
          "note": "ゴミ袋、トーチ棒（松明）受け取めE
        }
      ]
    },
    {
      "id": "s11",
      "time": "8朁E4日 14:00",
      "activity": "給水",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "修行＠めE��らぎ�E�E2�E�20�E�21�E�25番・おくじ�E陀羁E���E�E
        },
        {
          "role": "お茶",
          "note": "氷受け取り、�EめE��ぶにお茶を運ぶ→お茶提侁E
        },
        {
          "role": "飯・キャ",
          "note": "お茶運�E手伝う"
        }
      ]
    },
    {
      "id": "s12",
      "time": "8朁E4日 14:45",
      "activity": "裏方企画",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "裏方企画①�E�よろぁE��ａE�E�E00�E�E
        }
      ]
    },
    {
      "id": "s13",
      "time": "8朁E4日 15:00",
      "activity": "昼レク�E�びめE��ぶ",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "昼レク拁E��進衁E
        }
      ]
    },
    {
      "id": "s14",
      "time": "8朁E4日 16:05",
      "activity": "裏方施設打ち合わぁE,
      "roleNotes": [
        {
          "role": "裏方",
          "note": "施設打ち合わぁE金下け・阪本智乁E　�E�かめめE��"
        },
        {
          "role": "飯・キャ",
          "note": "飯盒�E下見\n※タイミングは施設の方から連絡あり"
        }
      ]
    },
    {
      "id": "s15",
      "time": "8朁E4日 16:10",
      "activity": "昼レク終亁E��裏方企画めE,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "宿舎に戻って勉強会、�E浴準備"
        },
        {
          "role": "裏方",
          "note": "宿舎に戻って入浴準備→夕べの雁E��"
        }
      ]
    },
    {
      "id": "s16",
      "time": "8朁E4日 16:30",
      "activity": "夕べの雁E��",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "玁E��雁E��"
        },
        {
          "role": "裏方",
          "note": "玁E��雁E��"
        }
      ]
    },
    {
      "id": "s17",
      "time": "8朁E4日 17:00",
      "activity": "入浴(、E7:50)",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "裏方はお亀 or 21�E�E0�E�２３！E0"
        }
      ]
    },
    {
      "id": "s18",
      "time": "8朁E4日 17:50",
      "activity": "夕飁E�E�E8:30)",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "ナイトレクで外�Eる人は屋外�E格好"
        },
        {
          "role": "裏方",
          "note": "夕食後、お亀の湯出発"
        },
        {
          "role": "生活",
          "note": "食後�Eお皿チェチE��"
        }
      ]
    },
    {
      "id": "s19",
      "time": "8朁E4日 18:40",
      "activity": "勉強会＠びめE��ぶ",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "給水"
        }
      ]
    },
    {
      "id": "s20",
      "time": "8朁E4日 19:00",
      "activity": "裏方ナイトレク準備",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "おどかし�E�持ち場の視寁E
        },
        {
          "role": "お茶",
          "note": "氷受け取り、ナイトハイク用アクエリ用愁E
        },
        {
          "role": "飯・キャ",
          "note": "お茶準備等�Eサポ�EチE
        }
      ]
    },
    {
      "id": "s21",
      "time": "8朁E4日 19:40",
      "activity": "勉強会終亁E,
      "roleNotes": [
        {
          "role": "裏方",
          "note": "おどかし�E�持ち場につぁE
        },
        {
          "role": "生活",
          "note": "玁E��で虫よけスプレー"
        },
        {
          "role": "お茶",
          "note": "ナイトレク出発前お茶提侁Eペット�Eトルから)\nアクエリ提侁E�E�お亀茶屋　金下さ・栁E��)"
        }
      ]
    },
    {
      "id": "s22",
      "time": "8朁E4日 19:50",
      "activity": "ナイトレク",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "進衁E
        },
        {
          "role": "裏方",
          "note": "おどかし�E�おどかす、E��張めE
        }
      ]
    },
    {
      "id": "s23",
      "time": "8朁E4日 21:00",
      "activity": "ナイトレク終亁E,
      "roleNotes": [
        {
          "role": "お茶",
          "note": "ジャグ洗い"
        }
      ]
    },
    {
      "id": "s24",
      "time": "8朁E4日 21:10",
      "activity": "班活動@宿舁E,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "スカーフしおり回収"
        }
      ]
    },
    {
      "id": "s25",
      "time": "8朁E4日 21:30",
      "activity": "裏方　入浴�E�ａE3:00�E�E,
      "roleNotes": [
        {
          "role": "裏方",
          "note": "持E��老E��　入浴時間"
        }
      ]
    },
    {
      "id": "s26",
      "time": "8朁E4日 21:40",
      "activity": "ご挨拶",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "币E��準備持E��E
        },
        {
          "role": "生活",
          "note": "币E��の敷き方説明（小林・森�E�E
        }
      ]
    },
    {
      "id": "s27",
      "time": "8朁E4日 21:50",
      "activity": "就寝準備",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "チ�Eフ歯磨き、就寝準備頁E��振り�EぁE
        },
        {
          "role": "裏方",
          "note": "币E��準備の手伝い"
        }
      ]
    },
    {
      "id": "s28",
      "time": "8朁E4日 22:00",
      "activity": "完�E消�E",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "消�E後�E見守り"
        },
        {
          "role": "お茶",
          "note": "翌日水筒用のお茶をやすらぎに配置"
        }
      ]
    },
    {
      "id": "s29",
      "time": "8朁E4日 22:30",
      "activity": "スタチE��ミ�EチE��ング@びめE��ぶ",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "振り返り、翌日の行程確誁E
        },
        {
          "role": "裏方",
          "note": "振り返り、翌日の行程確誁E
        },
        {
          "role": "保健",
          "note": "体調不良老E�E共朁E
        },
        {
          "role": "飯・キャ",
          "note": "キャンプファイヤーの松明�E持ち方確誁E
        }
      ]
    },
    {
      "id": "s30",
      "time": "8朁E4日 23:00",
      "activity": "",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "しおりコメンチE
        },
        {
          "role": "裏方",
          "note": "見回り①　男子：��下け・進藤　女子：山脁E�E益田"
        }
      ]
    },
    {
      "id": "s31",
      "time": "8朁E4日 24:00",
      "activity": "スタチE��完�E消�E",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "見回り②　男子：鈴士・中谷　女子：柳田・星加"
        }
      ]
    },
    {
      "id": "s32",
      "time": "8朁E5日 06:00",
      "activity": "起庁E,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "起床時刻前に征E��\n※飯盒�E格好"
        },
        {
          "role": "裏方",
          "note": "※飯盒�E格好"
        }
      ]
    },
    {
      "id": "s33",
      "time": "8朁E5日 06:30",
      "activity": "読絁E,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "抜粋：前読み、E��番、E6番、後読み"
        },
        {
          "role": "裏方",
          "note": "抜粋：前読み、E��番、E6番、後読み"
        }
      ]
    },
    {
      "id": "s34",
      "time": "8朁E5日 07:00",
      "activity": "朝�E雁E��",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "玁E��雁E���E�朝冷えるかも�E�E
        },
        {
          "role": "裏方",
          "note": "玁E��雁E��"
        },
        {
          "role": "生活",
          "note": "食後�Eお皿チェチE��\n"
        },
        {
          "role": "飯・キャ",
          "note": "食材受け取りサポ�EチE
        }
      ]
    },
    {
      "id": "s35",
      "time": "8朁E5日 07:50",
      "activity": "朝食（、E:30�E�E,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "しおり返却"
        }
      ]
    },
    {
      "id": "s36",
      "time": "8朁E5日 08:00",
      "activity": "",
      "roleNotes": [
        {
          "role": "生活",
          "note": "鍵を事務室に取りに行く、E��材受取�E�小林・星加　�E�E
        },
        {
          "role": "飯・キャ",
          "note": "まき受け取めE
        }
      ]
    },
    {
      "id": "s37",
      "time": "8朁E5日 08:30",
      "activity": "班活動＠宿舁E,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "軍手、水筒、タオル等飯盒準備"
        }
      ]
    },
    {
      "id": "s38",
      "time": "8朁E5日 09:30",
      "activity": "飯盒炊飯�E�、E1:30�E�＠本館丁E,
      "roleNotes": [
        {
          "role": "裏方",
          "note": "青年部カレーは生活・お茶拁E��中忁E��調琁E
        },
        {
          "role": "生活",
          "note": "カレーの作り方説明（星加�E�E
        },
        {
          "role": "飯・キャ",
          "note": "まきわり、火起こし"
        }
      ]
    },
    {
      "id": "s39",
      "time": "8朁E5日 10:30",
      "activity": "昼食開始（目安！E,
      "roleNotes": [
        {
          "role": "生活",
          "note": "食後�Eお皿チェチE��"
        },
        {
          "role": "お茶",
          "note": "かき氷、氷の受け取り、お茶提侁E食べるとぁE"
        }
      ]
    },
    {
      "id": "s40",
      "time": "8朁E5日 11:30",
      "activity": "牁E��け開姁E,
      "roleNotes": [
        {
          "role": "裏方",
          "note": "牁E��けサポ�EチE
        },
        {
          "role": "生活",
          "note": "鍋、皿の洗いチェチE��"
        }
      ]
    },
    {
      "id": "s41",
      "time": "8朁E5日 12:20",
      "activity": "移動開姁E,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "可能な限り宿舎戻って着替える"
        }
      ]
    },
    {
      "id": "s42",
      "time": "8朁E5日 12:30",
      "activity": "班活勁E,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "到着次第時間まで班活勁E
        },
        {
          "role": "お茶",
          "note": "びめE��ぶにお茶を運ぶ"
        },
        {
          "role": "飯・キャ",
          "note": "お茶運�E手伝う"
        }
      ]
    },
    {
      "id": "s43",
      "time": "8朁E5日 13:00",
      "activity": "勉強会@びめE��ぶ",
      "roleNotes": []
    },
    {
      "id": "s44",
      "time": "8朁E5日 13:30",
      "activity": "裏方修衁E,
      "roleNotes": [
        {
          "role": "裏方",
          "note": "修行＠めE��らぎ�E�E2�E�20�E�21�E�25番・おくじ�E陀羁E���E�E
        }
      ]
    },
    {
      "id": "s45",
      "time": "8朁E5日 14:00",
      "activity": "給水",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "裏方企画②�E�よろぁE
        },
        {
          "role": "お茶",
          "note": "氷受け取り→お茶提侁E
        },
        {
          "role": "飯・キャ",
          "note": "♪キャンプファイヤー出し物練翁E
        }
      ]
    },
    {
      "id": "s46",
      "time": "8朁E5日 14:10",
      "activity": "裏方　ヨガ",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "かなえちめE��ヨガレチE��ン"
        }
      ]
    },
    {
      "id": "s47",
      "time": "8朁E5日 14:50",
      "activity": "裏方　勉強企E,
      "roleNotes": [
        {
          "role": "裏方",
          "note": "勉強会：「まっすぐな向上忁E��持とぁE��につぁE��"
        }
      ]
    },
    {
      "id": "s48",
      "time": "8朁E5日 15:00",
      "activity": "備品受け取り",
      "roleNotes": [
        {
          "role": "飯・キャ",
          "note": "キャンプファイヤーセチE��受け取り"
        }
      ]
    },
    {
      "id": "s49",
      "time": "8朁E5日 15:50",
      "activity": "勉強会終亁E,
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
          "note": "めE��ら立て"
        }
      ]
    },
    {
      "id": "s50",
      "time": "8朁E5日 16:05",
      "activity": "裏方施設打ち合わぁE,
      "roleNotes": [
        {
          "role": "裏方",
          "note": "施設打ち合わぁE金下け・阪本智乁E　�E�かめめE��"
        }
      ]
    },
    {
      "id": "s51",
      "time": "8朁E5日 16:30",
      "activity": "夕べの雁E��",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "玁E��雁E��"
        }
      ]
    },
    {
      "id": "s52",
      "time": "8朁E5日 17:00",
      "activity": "入浴(、E7:40)",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "裏方はお亀 or 21�E�E0�E�２３！E0"
        },
        {
          "role": "生活",
          "note": "食後�Eお皿チェチE��"
        }
      ]
    },
    {
      "id": "s53",
      "time": "8朁E5日 17:40",
      "activity": "夕飁E、E8:20)",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "夕食後、宿舎へキャンプファイヤー準備\nそ�E後各班びめE��ぶでキャンプファイヤー練翁E
        },
        {
          "role": "裏方",
          "note": "夕食後、お亀の湯出発"
        }
      ]
    },
    {
      "id": "s54",
      "time": "8朁E5日 19:00",
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
      "time": "8朁E5日 19:10",
      "activity": "玁E��雁E���E�班長・班員�E�E,
      "roleNotes": [
        {
          "role": "お茶",
          "note": "アクエリ用愁E
        },
        {
          "role": "飯・キャ",
          "note": "火の管琁E
        }
      ]
    },
    {
      "id": "s56",
      "time": "8朁E5日 19:20",
      "activity": "キャンプファイアー@はつらつ庁E��",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "チ�Eフ：キャンプファイヤー準備"
        },
        {
          "role": "裏方",
          "note": "学生部サポ�EチEn小林(音響)、松允E動画)"
        }
      ]
    },
    {
      "id": "s57",
      "time": "8朁E5日 19:30",
      "activity": "歌集リクエスチE,
      "roleNotes": []
    },
    {
      "id": "s58",
      "time": "8朁E5日 19:40",
      "activity": "休�E①",
      "roleNotes": [
        {
          "role": "お茶",
          "note": "アクエリ提侁E
        }
      ]
    },
    {
      "id": "s59",
      "time": "8朁E5日 19:55",
      "activity": "しゅぁE��ぁE��めE��けん",
      "roleNotes": []
    },
    {
      "id": "s60",
      "time": "8朁E5日 20:05",
      "activity": "休�E②",
      "roleNotes": [
        {
          "role": "お茶",
          "note": "アクエリ提侁E
        }
      ]
    },
    {
      "id": "s61",
      "time": "8朁E5日 20:10",
      "activity": "マクドナルドゲーム",
      "roleNotes": []
    },
    {
      "id": "s62",
      "time": "8朁E5日 20:25",
      "activity": "休�E③、�E台準備",
      "roleNotes": [
        {
          "role": "お茶",
          "note": "アクエリ提侁E
        }
      ]
    },
    {
      "id": "s63",
      "time": "8朁E5日 20:35",
      "activity": "青年部出し物",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "7刁E��進藤"
        }
      ]
    },
    {
      "id": "s64",
      "time": "8朁E5日 20:42",
      "activity": "学生部出し物",
      "roleNotes": []
    },
    {
      "id": "s65",
      "time": "8朁E5日 20:50",
      "activity": "キャンプファイヤー終亁E,
      "roleNotes": []
    },
    {
      "id": "s66",
      "time": "8朁E5日 21:00",
      "activity": "班活動@宿舁E,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "しおり回叁E
        },
        {
          "role": "お茶",
          "note": "ジャグ洗い"
        }
      ]
    },
    {
      "id": "s67",
      "time": "8朁E5日 21:30",
      "activity": "ご挨拶",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "翌日、シーチE��収�E大掁E��連絡\n裏方　入浴�E�ａE3:00�E�E
        }
      ]
    },
    {
      "id": "s68",
      "time": "8朁E5日 21:40",
      "activity": "就寝準備",
      "roleNotes": []
    },
    {
      "id": "s69",
      "time": "8朁E5日 22:00",
      "activity": "完�E消�E",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "消�E後�E見守り"
        },
        {
          "role": "お茶",
          "note": "翌日水筒用のお茶をやすらぎに配置"
        }
      ]
    },
    {
      "id": "s70",
      "time": "8朁E5日 22:30",
      "activity": "スタチE��ミ�EチE��ング",
      "roleNotes": [
        {
          "role": "保健",
          "note": "体調不良老E�E共朁E
        }
      ]
    },
    {
      "id": "s71",
      "time": "8朁E5日 23:00",
      "activity": "",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "しおりコメンチE
        },
        {
          "role": "裏方",
          "note": "見回り①　男子：戸田・松允E��女子：��下さ・丸山"
        }
      ]
    },
    {
      "id": "s72",
      "time": "8朁E5日 24:00",
      "activity": "スタチE��完�E消�E",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "見回り②　男子：小林・阪本智也　女子：栁E��・谷巁E
        }
      ]
    },
    {
      "id": "s73",
      "time": "8朁E6日 06:00",
      "activity": "起庁E,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "起床時刻前に征E��\nシーチE��手伝う"
        },
        {
          "role": "裏方",
          "note": "自室のシーチE��収、やすらぎへ、学生部部屋�EシーチE��叁E
        },
        {
          "role": "保健",
          "note": "シーチE��数確誁E
        },
        {
          "role": "生活",
          "note": "シーチE��数確誁E
        }
      ]
    },
    {
      "id": "s74",
      "time": "8朁E6日 06:30",
      "activity": "読絁E,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "しおり返却"
        }
      ]
    },
    {
      "id": "s75",
      "time": "8朁E6日 07:00",
      "activity": "朝�E雁E��",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "玁E��に雁E��"
        },
        {
          "role": "裏方",
          "note": "玁E��に雁E��"
        },
        {
          "role": "飯・キャ",
          "note": "キャンプファイヤーの牁E��け"
        }
      ]
    },
    {
      "id": "s76",
      "time": "8朁E6日 07:40",
      "activity": "朝食（、E:20�E�E,
      "roleNotes": [
        {
          "role": "生活",
          "note": "食後�Eお皿チェチE��"
        }
      ]
    },
    {
      "id": "s77",
      "time": "8朁E6日 08:30",
      "activity": "大掁E���E�トイレ掁E��なし！E,
      "roleNotes": [
        {
          "role": "裏方",
          "note": "吁E��屋掃除チェチE���E���下�E進藤�E�E
        }
      ]
    },
    {
      "id": "s78",
      "time": "8朁E6日 08:50",
      "activity": "移勁E,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "荷物持ってびめE��ぶへ\n※これ以降宿舎に帰りません"
        },
        {
          "role": "裏方",
          "note": "荷物持ってびめE��ぶへ\n※これ以降宿舎に帰りません"
        }
      ]
    },
    {
      "id": "s79",
      "time": "8朁E6日 09:00",
      "activity": "宿泊棟退所",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "退所手続き(金下�E進藤)　�E�むしとめE
        }
      ]
    },
    {
      "id": "s80",
      "time": "8朁E6日 09:00",
      "activity": "勉強会発表@びめE��ぶ",
      "roleNotes": [
        {
          "role": "学生部",
          "note": "学年ごとに発表�E�E班�E�E
        },
        {
          "role": "裏方",
          "note": "学生部発表を後方で聞く"
        },
        {
          "role": "生活",
          "note": "発表撮影�E�松允E��E
        }
      ]
    },
    {
      "id": "s81",
      "time": "8朁E6日 10:00",
      "activity": "班活動（お楽しみ会！E,
      "roleNotes": [
        {
          "role": "保健",
          "note": "貴重品の返却\n酔い止め確誁E
        },
        {
          "role": "生活",
          "note": "学生部へお菓子、色紙�E币E
        },
        {
          "role": "お茶",
          "note": "パックジュース受取"
        },
        {
          "role": "飯・キャ",
          "note": "びめE��ぶブルーシート引く"
        }
      ]
    },
    {
      "id": "s82",
      "time": "8朁E6日 10:05",
      "activity": "裏方企画",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "裏方企画③@よろぁE��発表終亁E��第�E�E
        }
      ]
    },
    {
      "id": "s83",
      "time": "8朁E6日 11:50",
      "activity": "移動、�E真撮影",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "荷物搬出"
        }
      ]
    },
    {
      "id": "s84",
      "time": "8朁E6日 12:00",
      "activity": "昼食@よろぁE,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "昼飁Eおにぎり)"
        },
        {
          "role": "生活",
          "note": "おにぎり受取、E�E币E
        }
      ]
    },
    {
      "id": "s85",
      "time": "8朁E6日 12:15",
      "activity": "びめE��ぶ完�E退出",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "バス乗車絁E�E学生より�Eに乗車　奥から詰める"
        },
        {
          "role": "生活",
          "note": "昼食ゴミ回叁E
        }
      ]
    },
    {
      "id": "s86",
      "time": "8朁E6日 12:45",
      "activity": "曽爾出発",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "退所挨拶(中谷・金丁E"
        }
      ]
    },
    {
      "id": "s87",
      "time": "8朁E6日 15:00",
      "activity": "教会到着",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "備品牁E��け"
        },
        {
          "role": "お茶",
          "note": "ジャグ洗い"
        }
      ]
    },
    {
      "id": "s88",
      "time": "8朁E6日 15:30",
      "activity": "閉校弁E,
      "roleNotes": [
        {
          "role": "学生部",
          "note": "チ�Eフ進行\nそれぞれ挨拶"
        },
        {
          "role": "裏方",
          "note": "渡�E�動画流す"
        }
      ]
    },
    {
      "id": "s89",
      "time": "8朁E6日 16:00",
      "activity": "解散",
      "roleNotes": [
        {
          "role": "裏方",
          "note": "ドライバ�E�E�交通費渁E��E
        }
      ]
    }
  ],
  "tasks": [
    {
      "id": "t1",
      
      "name": "教会に賁E��郵送あめE,
      "deadline": "",
      "assignee": "教企E,
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t2",
      
      "name": "希望日提�E、E��催日決宁E,
      "deadline": "",
      "assignee": "地区長",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t3",
      
      "name": "林間申込期間、申し込みフォーム作�E",
      "deadline": "",
      "assignee": "会訁E,
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t4",
      
      "name": "学生部の活動計画�E�案）作�E",
      "deadline": "",
      "assignee": "チ�EチE,
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t5",
      
      "name": "青年部の活動計画�E�案）作�E",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t6",
      
      "name": "事前打ち合わせ会�E依頼",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t7",
      
      "name": "利用申込書・活動計画書作�E、提出",
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
      
      "name": "宿泊室の決宁E,
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t10",
      
      "name": "教会�E備品確認（学生部にも忁E��なも�Eを確認！E,
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t11",
      
      "name": "青年部用のしおり、行程表作�E",
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
      
      "name": "活動場所、E��事、�E浴時間の決定（施設問い合わせ！E,
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t14",
      
      "name": "食事注斁E��作�E、提出",
      "deadline": "",
      "assignee": "会訁E,
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t15",
      
      "name": "食物アレルギー　事前確認票の作�E�E�学生部に依頼�E�E,
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t16",
      
      "name": "アレルギー相諁E��食堂に電話�E�E,
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t17",
      
      "name": "売店注斁E��作�E",
      "deadline": "",
      "assignee": "会訁E,
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t18",
      
      "name": "宿泊老E��簿作�E",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t19",
      
      "name": "健康調査書作�E",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t20",
      
      "name": "部屋割り表作�E",
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t21",
      
      "name": "渁E��点検表、シーチE��カバ�E確認票作�E",
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t22",
      
      "name": "青年部の自家用車�E確誁E,
      "deadline": "",
      "assignee": "会訁E,
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t23",
      
      "name": "青年部裏方役割決めE,
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t24",
      
      "name": "青年部の裏方企画の冁E��決めE,
      "deadline": "",
      "assignee": "勉強企E,
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t25",
      
      "name": "センターへの手土産購入�E�E,500冁E��度�E�E,
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t26",
      
      "name": "ガソリン満タンでの依頼筁E,
      "deadline": "",
      "assignee": "会訁E,
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "t27",
      
      "name": "スタチE��打ち合わせ実施",
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "p1",
      
      "name": "食事�E物品注斁E��の作�E",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "p2",
      
      "name": "食物アレルギー事前確認票の作�E",
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "p3",
      
      "name": "施設との事前打合ぁE,
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "p4",
      
      "name": "宿泊利用老E��名簿の提�E",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "p5",
      
      "name": "入所時確認票の提�E",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "p6",
      
      "name": "救急セチE��、体温計、おぁE��処琁E��チE��の準備",
      "deadline": "当日まで",
      "assignee": "保健",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "f1",
      
      "name": "【�E体】林間学校 備品リスト�E作�E",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "f2",
      
      "name": "事前チェチE��シート�E作�E",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "f3",
      
      "name": "宿泊棟別�E�部屋別�E�記�E表の作�E",
      "deadline": "",
      "assignee": "生活",
      "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "f4",
      
      "name": "駐車許可証の作�E",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "f5",
      
      "name": "【保護老E��ンケート】�E作�E",
      "deadline": "",
      "assignee": "全員", "memo": "", "fileUrl": "", "completed": false
    },
    {
      "id": "f6",
      
      "name": "【裏方スタチE��】アンケート�E作�E",
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
    if (!redisUrl) return { success: false, error: 'Redis URL (KV_REST_API_URL) が設定されてぁE��せん' };
    const settings = await redis.get<Settings>("rinkan_settings_v6") || { viewerPassword: 'kansai2026' };
    if (password === settings.viewerPassword) {
      const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      await redis.set(`session_${sessionId}`, 'viewer', { ex: 60 * 60 * 24 * 7 });
      (await cookies()).set('session', sessionId, { httpOnly: true, secure: true, maxAge: 60 * 60 * 24 * 7, path: '/' });
      return { success: true };
    }
    return { success: false, error: 'パスワードが間違ってぁE��ぁE };
  } catch (e: any) {
    return { success: false, error: 'サーバ�Eエラー: ' + e.message };
  }
}

export async function loginAsAdmin(username: string, password: string) {
  try {
    if (!redisUrl) return { success: false, error: 'Redis URL (KV_REST_API_URL) が設定されてぁE��せん' };
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
    return { success: false, error: 'IDまた�Eパスワードが間違ってぁE��ぁE };
  } catch (e: any) {
    return { success: false, error: 'サーバ�Eエラー: ' + e.message };
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
  if (users.find(u => u.username === username)) return { success: false, error: '既に存在するIDでぁE };
  users.push({ id: 'u' + Date.now(), username, password, role, name });
  await redis.set("rinkan_users_v6", users);
  revalidatePath('/');
  return { success: true };
}

export async function deleteUser(id: string) {
  let users = await getUsers();
  if (users.length <= 1) return { success: false, error: '最後�E管琁E��E�E削除できません' };
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
  if (!role) return { success: false, error: '招征E��ンクが無効か、期限�EれでぁE };
  
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

