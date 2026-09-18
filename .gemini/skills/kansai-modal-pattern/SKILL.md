---
name: 関西林間アプリのモーダル実装ルール
description: 関西林間アプリ（rinkan-app）における各種モーダルの実装パターンとUI/UXルール
---

# 関西林間アプリ モーダル実装ルール

このプロジェクト（rinkan-app）では、ユーザーからの要望により、すべてのモーダルに対して統一されたUI/UXルールが定められています。
新しくモーダルを追加する際や、既存のモーダルを修正する際は、必ず以下のルールに従ってください。

## 1. キャンセルボタンの廃止
モーダルの下部（フッター領域）に配置される「キャンセル」や「閉じる」といったテキストボタンは使用しません。
保存や実行など、アクションを確定するためのボタン（例：「保存する」「削除」）のみを右下に配置してください。

## 2. 右上の「×」ボタンによるキャンセル
キャンセルアクションは、モーダル右上に配置する「×」ボタン（Lucide Reactの `<X />` アイコン）に統一します。

実装例:
```tsx
<button 
  onClick={closeModal} 
  type="button" 
  className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors z-10"
>
  <X size={20} />
</button>
```
※ボタンを絶対配置するため、親要素（`motion.div` 等）には必ず `className="... relative"` を付与してください。

## 3. 背景（バックドロップ）タップでのキャンセル
モーダルの外側（暗くグレーアウトしている背景部分）をクリック・タップした際にも、モーダルを閉じるように実装してください。

実装例:
```tsx
<div 
  className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" 
  onClick={closeModal} // ← 背景クリックで閉じる
>
  <motion.div 
    className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative" 
    onClick={e => e.stopPropagation()} // ← モーダル内部のクリックイベントが背景に伝播しないようにする
  >
    {/* モーダルの中身 */}
  </motion.div>
</div>
```

## 4. 確認モーダル（GlobalConfirm）の文言カスタマイズ
削除などの破壊的アクションを行う際の確認モーダルでは、ボタンの文言を「実行する」に固定せず、アクションに応じた適切な言葉（例：「削除」）に変更してください。
`globalConfirm` ステートには `confirmText` プロパティが用意されています。

実装例:
```tsx
setGlobalConfirm({ 
  isOpen: true, 
  message: 'この行程を完全に削除しますか？', 
  confirmText: '削除', // ← ここで文言を指定
  onConfirm: () => { ... }
});
```
