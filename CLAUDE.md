# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

映画のシーンからインスパイアされた音楽プロジェクト「SAY-SHOW」のランディングページ。Jekyllベースの静的サイトで、GitHub Pagesで公開されています。

**重要:** このプロジェクトは2つのリポジトリで構成されています:
- **say-show-src** (このリポジトリ / Private): ソースコード、すべての開発作業はここで実施
- **say-show** (別リポジトリ / Public): ビルド済みサイト、GitHub Actionsで自動更新、**直接編集禁止**

## 開発コマンド

### 前提条件: Ruby環境
macOSのシステムRuby（2.6系）ではBundler 4が動作しないため、Homebrew版Ruby 3.4以上が必要。

```bash
# Homebrew版Rubyをインストール（未インストールの場合）
brew install ruby@3.4

# PATHにHomebrew版Rubyを優先設定（セッションごとに必要）
export PATH="/opt/homebrew/opt/ruby@3.4/bin:$PATH"
```

**注意:** `bundle` コマンド実行時に `Could not find 'bundler' (4.0.2)` エラーが出る場合、上記の `export PATH` が未設定。シェルの設定ファイル（`~/.zshrc` 等）に追加すると永続化できる。

### セットアップ
```bash
bundle install
```

### ローカル開発サーバー起動
```bash
bundle exec jekyll serve
```
→ http://localhost:4000/say-show/ でアクセス

### 本番ビルド
```bash
bundle exec jekyll build
```
→ `_site/` ディレクトリに静的サイトを生成

## プロジェクトアーキテクチャ

### コンテンツ管理
- **トラックデータ**: `_tracks/{slug}.md` にマークダウンファイルとして管理
- **画像**: `images/{slug}.png` にカバーアート（800×800px推奨）
- **レイアウト**: `_layouts/track.html` と `_layouts/about.html`
- **スタイル**: `style.css` に全スタイルを集約
- **メインページ**: `index.html` (Jekyllテンプレート)

### トラックファイルの構造
各トラックは以下のYAMLフロントマターを持つ:
- `title`: 曲のタイトル
- `slug`: URL用の識別子（ハイフン区切り）
- `status`: `released` または `coming-soon`
- `release_date`: リリース日（yyyy-mm-dd形式）
- `movie`: インスパイア元の映画
- `comment`: 曲の説明
- `links`: 配信サービスのURL（spotify, apple, amazon, youtube_music）
- `lyrics`: 歌詞（YAML multiline）

### 自動化ワークフロー

#### デプロイ (deploy.yml)
- **トリガー**: `main` ブランチへの push
- **処理**:
  1. Jekyllでビルド
  2. `say-show` リポジトリに自動デプロイ
  3. 配信リンク不足チェック → 不足時に `missing-links` ラベル付きIssueを自動作成

#### 日次ビルド (daily-build.yml)
- **実行時刻**: 毎日JST 0:10 (UTC 15:10)
- **処理**:
  - `status: coming-soon` かつリリース日到達のトラックを自動的に `status: released` に変更
  - 配信リンク不足の場合、Issue自動作成
  - Coming Soonバナーは公開日の3日前から表示

#### トラック作成 (create-track.yml)
- **トリガー**: GitHub Issue「新規トラック追加」テンプレートの作成（`new-track` ラベル）
- **処理**:
  1. Issueの内容から `_tracks/{No}-{slug}.md` を自動生成
  2. カバーアート画像をダウンロード（添付されている場合）
  3. `track/{slug}` ブランチを作成してPRを発行
  4. 内容を確認のうえマージすることで `main` に反映
  5. 配信リンク不足がある場合、`missing-links` ラベル付きIssueを自動作成
- **運用ルール**: トラック番号（`track_no`）はファイル名の最大番号+1で自動採番されるため、**前のトラックPRがマージされる前に次のトラックIssueを作成しない**こと（番号の衝突を防ぐため）

#### 画像最適化 (optimize-images.yml)
- **トリガー**: `images/` 配下への画像追加
- **処理**: 800×800pxリサイズ、PNG圧縮、WebP生成

## 重要なルールと原則

### コミュニケーション
- **すべての日本語で統一**: ドキュメント、コメント、コミットメッセージ
- **例外**: CSS class名、JavaScript関数名など技術的な識別子

### 開発プロセス
1. **ファイル全体を読んでから編集**: 短絡的な判断・部分的な編集を避ける
2. **プロトタイピング重視**: 重要な変更は必ずプロトタイプで確認してから本番反映
3. **十分な議論**: 実装前にユーザーと打ち合わせ

### デザイン原則
- **世界観**: 音楽プロジェクトの「温かさ」「光感」「人間らしさ」を重視
- **カラー**: ダークテーマ（#0d1118背景）、アクセントはピンク（#ff4b8b）
- **レイアウト**: 正方形トラックカード（1:1）、ガラスモーフィズムオーバーレイ

### コミットメッセージ形式
```
<prefix>: <日本語の説明>

<詳細（オプション）>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```
プレフィックス例: `feat:`, `fix:`, `docs:`, `style:`, `update:`

## ファイル構成

```
say-show-src/
├── _tracks/              # 各曲のマークダウンファイル
├── images/               # カバーアート画像（800×800px）
├── _layouts/             # Jekyllレイアウトテンプレート
│   ├── track.html        # 曲詳細ページ
│   └── about.html        # Aboutページ
├── style.css             # メインスタイルシート
├── main.js               # JavaScriptロジック
├── index.html            # トップページ
├── about.md              # Aboutページコンテンツ
├── timeline.html         # タイムラインページ
├── .github/workflows/    # GitHub Actionsワークフロー
│   ├── deploy.yml        # 自動デプロイ
│   ├── daily-build.yml   # 日次自動ビルド
│   ├── create-track.yml  # Issue経由のトラック作成
│   └── optimize-images.yml # 画像最適化
├── _config.yml           # Jekyll設定
├── Gemfile               # Ruby依存関係
└── README.md             # メンテナンス手順書
```

## よくある作業

### 新規トラック追加
GitHub Issues → 「新規トラック追加」テンプレート → PR自動作成 → レビュー・マージで反映
※前のトラックPRがマージされるまで次のトラックIssueを作成しないこと

### 配信リンク追加
`_tracks/{slug}.md` の `links` セクションを編集 → commit & push → 自動デプロイ

### スタイル変更
`style.css` を編集 → commit & push → 自動デプロイ

### 画像追加・変更
`images/{slug}.png` を追加（800×800px推奨） → commit & push → 自動最適化 → 自動デプロイ

## 注意事項

- **公開リポジトリ（say-show）は直接編集しない**: すべての変更は say-show-src で実施
- **デプロイは自動**: main ブランチへの push で自動デプロイが実行される（30秒～2分）
- **画像最適化**: `images/` に追加した画像は GitHub Actions で自動的に最適化される（2～5分）
- **配信リンク管理**: `status: released` で配信リンク不足がある場合、自動的に Issue が作成される
