# プレビュー音源機能 実装メモ

配信前から各トラックページで30〜90秒のプレビューが聴けるようにする機能。
2026-04-26 着手、未デプロイ。

## 背景・目的

- 現状の Preview セクションは Spotify embed で、**配信開始までは試聴不可**
- 配信前から「効かせたい部分」を聴いてもらえるようにしたい
- フル音源は置かず、プレビュー音源のみ自前ホスト
- ファイルバックアップ（フル音源の保存）は今回スコープ外

## 仕様（決定事項）

### プレビュー音源
- **デフォルト**: 0:00 - 1:30（頭から **90秒**、Apple/Amazon と同等）
- **範囲指定可能**: `mm:ss-mm:ss` または `秒-秒` 形式（例: `0:30-2:00`）
- **フェードアウト**: 末尾 3 秒（常時）
- **フェードイン**: start > 0 のとき自動で冒頭 2 秒付与
- **ビットレート**: 128kbps ステレオ
- **トラックごとに長さ可変**（再生成時に引数で指定）

### 入出力
- 入力: `music/{slug}.mp3` または `music/{slug}.wav`（`music/` は **gitignore 対象**、ローカルのみ保管）
- 出力: `audio/{slug}.mp3`（**通常git で commit 対象**、LFS は使用しない）
- 既存パターン踏襲のため slug のみ（番号なし）

### ストレージとデプロイの責務分担
| リポジトリ | 役割 | プレビューMP3の扱い |
|---|---|---|
| **say-show-src**（このリポ・Private） | ソース管理 | `audio/{slug}.mp3` を commit & push（手動 or Web UI から直接アップロード） |
| **say-show**（Public） | ビルド済みサイト | `deploy.yml` が Jekyll ビルド経由で自動push（手動操作不要） |

- **LFS不使用**: 90秒・128kbps stereo MP3 ≈ 1.4MB/曲、10年継続(550曲)でも約770MB → 通常gitで余裕
- **`audio: true` への切り替えは自動化済み**（`.github/workflows/update-audio-field.yml`）
  - `audio/*.mp3` が push されると、対応する `_tracks/{No}-{slug}.md` の `audio: false` → `true` に GitHub Action が自動更新 → そのまま deploy
  - カバー画像の `update-image-field.yml` と同じパターン
  - Claude Code経由で push する場合は同コミット内で `audio: true` も書き換えるため、このActionは空振り（無害）

### 基本運用：Claude Codeに依頼
1. ローカルでプレビュー生成: `./scripts/make-preview.sh <slug> [range]`
2. Claude Code に依頼: 「**`<slug>` のプレビューを push して**」
3. Claude が以下を1コミットで実行:
   - 該当 `_tracks/{No}-{slug}.md` の `audio: false` → `audio: true` に書き換え
   - `git add audio/<slug>.mp3 _tracks/{No}-{slug}.md`
   - `git commit -m "feat: <slug> のプレビュー音源を追加"`
   - `git push`
4. GitHub Actions が deploy → サイト反映

**メリット**: 1コミットで完結、ローカル/リモート完全同期、slug間違いをClaudeが事前チェック可能

### 代替手段（Claude Codeが使えない場合）
- **Web UI ドラッグ&ドロップ**: ブラウザから `audio/` に直接アップロード → Action が `audio: true` 更新
  - ⚠️ ローカルに同名mp3が untracked で残る → アップロード後に `rm audio/<slug>.mp3` してから `git pull`
- **コマンドライン手動**: `git add` → `git commit` → `git push` を自分で実行

### 表示ロジック（`_layouts/track.html` の Preview セクション）
| 状態 | 表示 |
|---|---|
| `audio: true`（プレビュー有り） | 自前 `<audio>` プレイヤー |
| `audio: false` かつ `released` | 既存の Spotify embed |
| `audio: false` かつ `coming-soon` | 非表示 |

→ **全曲のプレビューMP3が揃った段階で Spotify embed の分岐を削除**する予定（その時点で C-1 案: Spotify embed 完全廃止）

### og:audio メタタグ
- **廃止**（30〜90 秒プレビューが SNS でフル音源と誤認されるのを防ぐため）

## 実装済み

| 変更 | 内容 |
|---|---|
| `.gitignore` | `music/` を除外 |
| `_layouts/track.html` | 既存 `<audio>` セクションを削除し Preview セクションに統合、`audio: true` 優先 / Spotify embed フォールバック分岐に変更、`og:audio` メタタグ削除 |
| `scripts/make-preview.sh` | 新規作成（chmod +x 済み）。デフォルト90秒、範囲指定可、自動フェード |
| `.github/workflows/update-audio-field.yml` | 新規作成。`audio/*.mp3` push で対応するトラックMDを `audio: true` に自動更新（カバー画像の同種ワークフローと同パターン） |

### 未コミット（git status）
```
modified:   .gitignore
modified:   _layouts/track.html
modified:   say-show-src        # 別件のサブモジュール更新（無関係、コミット対象外）
untracked:  audio/              # ディレクトリ + audio/late-into-your-future.mp3 (90秒)
untracked:  scripts/make-preview.sh
```

`coming-soon-ribbon-demo.html` は別件で生成された未追跡ファイル、本タスクとは無関係。

### 動作確認済み
- `late-into-your-future.wav` (49MB) → `audio/late-into-your-future.mp3` (約1.4MB, 90秒) 生成成功
- 範囲指定（`0:30-1:30`）でフェードイン2秒+フェードアウト3秒も動作確認済み

## 残タスク

### A. 初回デプロイ前の動作確認
- [ ] `_tracks/014-late-into-your-future.md` の `audio: false` を `audio: true` に変更
- [ ] `bundle exec jekyll serve` でローカル起動
- [ ] http://localhost:4000/say-show/tracks/014-late-into-your-future/ にアクセス
  - [ ] Preview セクションに自前 `<audio>` プレイヤーが表示される
  - [ ] 90秒で末尾フェードアウトしながら停止する
  - [ ] Spotify embed が表示されないこと（`audio: true` の場合）
- [ ] 別の `audio: false` トラック（例: `_tracks/021-...`）も開いて、Spotify embed が**従来通り**表示されることを確認（リグレッション防止）

### B. 初回コミット
動作確認OKなら以下を一括コミット:
- `.gitignore`
- `_layouts/track.html`
- `scripts/make-preview.sh`
- `audio/late-into-your-future.mp3`
- `_tracks/014-late-into-your-future.md`（`audio: true` への変更）

コミットメッセージ案:
```
feat: トラック別プレビュー音源(90秒)機能を追加

- audio:true のトラックは自前MP3プレイヤーを表示、未設定はSpotify embedにフォールバック
- scripts/make-preview.sh: WAV/MP3から90秒プレビュー生成（任意区間・自動フェード対応）
- og:audioメタタグはプレビュー誤認回避のため削除
- music/ をgitignore対象に追加
```

### C. 残り全曲のプレビュー生成（運用）
- 全曲分（既存約30曲）のフル音源を `music/{slug}.{wav,mp3}` に配置
- 各曲ごとに `./scripts/make-preview.sh {slug} [range]` 実行
- 該当 `_tracks/{No}-{slug}.md` の `audio: false` → `audio: true` に変更
- `slug` の確認方法: `grep "^slug:" _tracks/*.md`

### D. 全曲完了後（任意・将来作業）
- [ ] `_layouts/track.html` の Spotify embed フォールバック分岐を削除（C-1 案完全移行）
- [ ] 不要になった CSS（`.track-preview-embed`）の削除検討

## 使い方リファレンス

```bash
# プロジェクトルート or music/ どこからでも実行可

# デフォルト: 0:00-1:30 (90秒)
./scripts/make-preview.sh late-into-your-future

# サビ頭から60秒
./scripts/make-preview.sh late-into-your-future 0:30-1:30

# 短い30秒版
./scripts/make-preview.sh late-into-your-future 0-30

# 1:00-2:30 (秒指定)
./scripts/make-preview.sh late-into-your-future 60-150
```

引数は **slug のみ**（拡張子なし）。`_tracks/{No}-{slug}.md` の `slug:` フィールドの値と一致させる。

## 関連ファイル

- 仕様検討の経緯: 本セッションのチャットログ
- スクリプト: `scripts/make-preview.sh`
- レイアウト: `_layouts/track.html`（Preview セクション周辺）
- gitignore: `.gitignore`（末尾の `music/`）

## 注意事項

- `music/` 配下のファイルは絶対に commit しない（既存の `君に遅刻していく.wav` など2ファイルは別用途で置かれているもの、gitignore済みなので安全）
- ffmpeg 必須（`brew install ffmpeg`、確認済み: `/opt/homebrew/bin/ffmpeg`）
- 既存トラックは全て `audio: false` のため、Aの動作確認まで本番表示は変わらない（安全な段階導入）
