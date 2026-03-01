# ======================================================================================
# 10. インポートおよび Flask 基本設定
# ======================================================================================
import os
import io
import time
import base64
import sys
import requests
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg') # GUIなしのバックエンド（サーバー用）を強制指定
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import urllib.request
from datetime import datetime, timezone, timedelta
from PIL import Image
from flask import Flask, render_template, request, session, jsonify, redirect, url_for

app = Flask(__name__)
# 秘密鍵は環境変数から取得、なければ固定値。
# [重要] インデント（行頭の空白）は一切入れないこと
app.secret_key = os.environ.get('SECRET_KEY', 'pin_weather_secret_key_2026')

# ======================================================================================
# 11. 定数・基本設定 (CONFIG)
# ======================================================================================
CONFIG = {
    "TITLE_SIZE": 20,
    "SUBTITLE_SIZE": 16,
    "DEFAULT_MAP_TILE": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    "DEFAULT_MAP_TILE_LABEL": "道路図",
    "MAP_HEIGHT": 350,
    "SHOW_WIND": True,
    "SHOW_TEMP": True,
    "SHOW_WAVE": True,
    "SHOW_OCEAN_TEMP": True,
    "SHOW_TIDE": True,
    "SHOW_W_TEXT": False,
    "SHOW_DIR_NAME": False,
    "GRAPH_WIDTH": 15.0,
    "FIXED_HSPACE_INCH": 0.2,
    "GRAPH_ORDER": ["WIND", "TEMP", "WAVE", "OCEAN", "TIDE"],
    "GRAPH_HEIGHTS": {"WIND": 1.2, "TEMP": 0.4, "WAVE": 0.4, "OCEAN": 0.4, "TIDE": 0.4},
    "GRAPH_HIGHT": 3.0,
    "DEFAULT_RATIOS": [4.0, 1.0, 1.0, 1.0, 1.0],
    "HSPACE": 1.25,
    "GRAPH_FONT_SIZE": 10,
    "LABEL_SIZE": 7,
    "LABEL_PAD": 0,
    "DPI": 200,
    "DEFAULT_DANGER_V": 10.0,
    "DEFAULT_PRECIP_Y": 1.05,
    "DEFAULT_ICON_MARGIN": 0,
    "ANNOT_Y_STEP": 1.5,
    "ANNOT_BASE_Y": 0.5,
    "TEMP_COLOR": "darkorange",
    "ARROW_COLOR": "blue",
    "VLINE_WIDTH": 1.0,
    "HLINE_WIDTH": 1.0,
    "CONTENA_MIN_W": 2500,
    "LEFT_VIEW_W": 116,
    "LEFT_SHIFT": -185,
    "DIAL_H_GAP": 0,
    "DIAL_V_GAP": 0,
    "FAV_BTN_WIDTH": 30,
    "FAV_NAME_LEN": 12,
    "SLIDER_WIDTH": {"min": 13.0, "max": 30.0, "step": 1.0},
    "SLIDER_HEIGHT": {"min": 0.1, "max": 5.0, "step": 0.1},
    "SLIDER_FONT": {"min": 6, "max": 14, "step": 1},
    "SHOW_DEV_MODE": False,
    "STORAGE_KEY": "wind_checker_settings_v2",
    "DEFAULT_LAT": 31.337,
    "DEFAULT_LON": 130.795,
    "DEFAULT_BASHO": "高須沖(鹿児島県)",
    "DEFAULT_DIRS": ["南","南南西","南西","西南西","西","西北西","北西","北北西"],
    "LOCATION_MASTER": {
        "高須沖(鹿児島県)": (31.337, 130.795), "ユクサ沖(鹿児島県)": (31.373, 130.777), 
        "住吉浜沖(大分県)": (33.408, 131.674), "逗子海岸沖(神奈川県)": (35.286, 139.546),
        "津久井浜沖(神奈川県)": (35.194, 139.670), "御前崎沖(静岡県)": (34.592, 138.205),
        "本栖湖中央(山梨県)": (35.463, 138.582), "浜名湖村櫛沖(静岡県)": (34.714, 137.577),
        "甲子園浜沖(兵庫県)": (34.696, 135.326), "柏原沖(鹿児島県)": (31.380, 131.020), 
        "磯海岸沖(鹿児島県)": (31.614, 130.577), "江口浜沖(鹿児島県)": (31.643, 130.322),
        "垂水港(鹿児島県)": (31.478, 130.668), "海潟(鹿児島県)": (31.539, 130.706), 
        "カナハ沖(マウイ島)": (20.908, -156.446), "ポゾ沖(グランカナリア)": (27.822, -15.417),
        "グリュイッサン沖(DEFI)": (43.084, 3.150), "アンスバタ沖(ニューカレドニア)": (-22.305, 166.442),
        "ニューヨーク(米国)": (40.7128, -74.0060), "ロンドン(英国)": (51.5074, -0.1278)
    }
}

ALL_DIRECTIONS = ["北", "北北東", "北東", "東北東", "東", "東南東", "南東", "南南東", "南", "南南西", "南西", "西南西", "西", "西北西", "北西", "北北西"]

# ======================================================================================
# 12. 多言語表示用の辞書データを定義するサブルーチン。
# ======================================================================================
def get_language_dict():
    """
    多言語表示用の辞書データを定義するサブルーチン。
    Flask版の新規UI（詳細設定モーダル等）に必要なキーを既存の辞書に統合。
    """
    return {
        "ja": {
            "表示設定": "表示設定",
            "⛵Pin_Weather!": "⛵Pin_Weather!",
            "LABEL_FAV_ADD": "⭐ My Spots 追加",
            "LABEL_FAV_OK": "✅ My Spots 登録済",
            "FAV_PREFIX": "📍 ",
            "MAP_SELECT_LABEL": "地図指定",
            "BTN_SEARCH_CITY": "🔍 地名検索",
            "BTN_CURRENT_LOC": "🔄📍現在地　　　　　　　　　　",
            "MSG_GETTING_LOC": "🛰️ 現在地を取得中...",
            "MSG_IDENTIFY_LOC": "現在地の地名を特定中...",
            "ERR_LOC_FAILED": "❌ 位置情報の取得に失敗しました。",
            "BTN_UPDATE": "更新",
            "BTN_MAP": "🗺️地図",
            "BTN_CURRENT_LOC_SHORT": "📍現在地",
            "SELECT_PLACE": "地点を選択してください",
            "HELP_FAV_SAVED": "お気に入り登録済み",
            "HELP_FAV_SAVE": "この場所をお気に入りに登録",
            "MSG_GEN_GRAPH": "グラフを生成中...",
            "⚙ 詳細設定": "⚙ 詳細設定",
            "📍 My Spots 編集": "📍 My Spots 編集",
            "🚨 My Spots の登録制限（10件）に達しています。": "🚨 My Spots の登録制限（10件）に達しています。",
            "「My Spots 編集」から不要な地点を削除してください。": "「My Spots 編集」から不要な地点を削除してください。",
            "この地点を My Spots に保存します。": "この地点を My Spots に保存します。",
            "現在": "現在",
            "My Spots の名称確認": "My Spots の名称確認",
            "登録名（修正可）": "登録名（修正可）",
            "OK（保存実行）": "OK (保存実行)",
            "登録されている地点はありません。": "登録されている地点はありません。",
            "登録済": "登録済",
            "名前を変更": "名前を変更",
            "保存": "保存",
            "戻る": "戻る",
            "削除しますか？": "削除しますか？",
            "削除": "削除",
            "中止": "中止",
            "グラフ表示設定の詳細": "グラフ表示設定の詳細",
            "デザイン微調整": "デザイン微調整", # 新規
            "風向・風速グラフ表示": "風向・風速グラフ表示",
            "気温グラフ表示": "気温グラフ表示",
            "潮位グラフ表示": "潮位グラフ表示",
            "波高グラフ表示": "波高グラフ表示",
            "海面水温グラフ表示": "海面水温グラフ表示",
            "天気文字表示": "天気文字表示",
            "風向名表示": "風向名表示",
            "グラフ枠横幅 (inch)": "グラフ枠横幅 (inch)",
            "グラフ枠縦幅 (inch)": "グラフ枠縦幅 (inch)",
            "グラフ横幅": "グラフ横幅", # スライダー用
            "グラフ縦幅": "グラフ縦幅", # スライダー用
            "上余白": "上余白",         # スライダー用
            "上下間隔": "上下間隔",      # スライダー用
            "左余白": "左余白",         # スライダー用
            "グラフ内文字サイズ": "グラフ内文字サイズ",
            "フォントサイズ": "フォントサイズ", # スライダー用
            "軸ラベル文字サイズ": "軸ラベル文字サイズ",
            "危険風速ライン(m/s)": "危険風速ライン(m/s)",
            "色付風向選択": "色付風向選択",
            "開発用詳細設定": "開発用詳細設定",
            "コンテナ最小幅 (px)": "コンテナ最小幅 (px)",
            "解像度 (DPI)": "解像度 (DPI)",
            "グラフ間余白": "グラフ間余白",
            "ラベル距離": "ラベル距離",
            "地図ダイアログ調整": "地図ダイアログ調整",
            "地図ダイアログ横余白 (H-Gap)": "地図ダイアログ横余白 (H-Gap)",
            "地図ダイアログ縦余白 (V-Gap)": "地図ダイアログ縦余白 (V-Gap)",
            "My Spots 編集ダイアログ調整": "My Spots 編集ダイアログ調整",
            "ボタン幅 (%)": "ボタン幅 (%)",
            "地名表示制限 (文字)": "地名表示制限 (文字) ",
            "降水量・アイコン位置調整": "降水量・アイコン位置調整",
            "降水量ラベル高さ": "降水量ラベル高さ",
            "天気アイコン下余白": "天気アイコン下余白",
            "グラフ縦比率設定": "グラフ縦比率設定",
            "比率:風向": "比率:風向",
            "比率:気温": "比率:気温",
            "比率:潮位": "比率:潮位",
            "初期設定に戻す": "初期設定に戻す",
            "リセット": "リセット", # 追加
            "デフォルトに戻す": "デフォルトに戻す", # 追加
            "更新": "更新",
            "キャンセル": "キャンセル",
            "現在の登録地点 (クリックで削除)": "現在の登録地点 (クリックで削除)",
            "--- 地点の追加 ---": "--- 地点の追加 ---",
            "地名を入力": "地名を入力",
            "緯度": "緯度",
            "経度": "経度",
            "地点を追加": "地点を追加",
            "閉じる": "閉じる",
            "📍 地図指定": "📍 地図指定",
            "地図中心に📍": "地図中心に📍",
            "確定": "確定",
            "場所を検索": "場所を検索",
            "検索": "検索",
            "検索中...": "検索中...",
            "見つかりませんでした": "場所が見つかりませんでした",
            "地図表示切替": "表示切替",
            "標準": "標準 (OSM)",
            "シンプル": "シンプル (白)",
            "ダーク": "ダーク (黒)",
            "道路図": "道路図",
            "衛星写真": "衛星写真",
            "地名取得中...": "地名取得中...",
            "指定地点": "指定地点",
            "風速 (m/s)": "風速 (m/s)",
            "気温 (℃)": "気温 (℃)",
            "潮位 (cm)": "潮位 (cm)",
            "波高 (cm)": "波高 (cm)",
            "海水温 (℃)": "海水温 (℃)",
            "降水量mm　": "降水量mm　",
            "天気": "天気",
            "OCEAN_INFO": "※海洋データは、指定地点の最寄り（{res_dir}約{dist_km}km）のデータを表示しています。",
            "OCEAN_NONE": "※指定地点の近傍(30km圏内)に有効な海洋データがないため表示されません",
            "LEGEND_TITLE": "📊 凡例:",
            "LEGEND_BLUE": "3-5m/s (青)",
            "LEGEND_ORANGE": "5-10m/s (橙)",
            "LEGEND_RED": "10m/s以上 (赤)",
            "LEGEND_DANGER_LINE": "[赤点線: 危険風速ライン {v}m/s]",
            "LEGEND_NOTE": "※青・橙は、詳細設定で選択した色付風向のみ表示",
            "DISCLAIMER": "※本データは予測値であり、実際の天候と異なる場合があります。航海や活動の際は、必ず最新の気象情報を確認し、自己責任でご利用ください。",
            "LINK_WEATHER": "天気予報APIデータ",
            "LINK_MARINE": "海洋気象APIデータ",
            "WEEKS": ["月", "火", "水", "木", "金", "土", "日"],
            "WEATHER_TEXT": {"晴": "晴", "霧": "霧", "雨": "雨", "雪": "雪", "雷": "雷", "？": "？"},
            "ALL_DIRECTIONS": ["北", "北北東", "北東", "東北東", "東", "東南東", "南東", "南南東", "南", "南南西", "南西", "西南西", "西", "西北西", "北西", "北北西"],
            "DIRECTIONS_8": ["北", "北東", "東", "南東", "南", "南西", "西", "北西"],
            "NORTH":"北",
            "LOCATIONS": {
                "高須沖(鹿児島県)": "高須沖(鹿児島県)", "ユクサ沖(鹿児島県)": "ユクサ沖(鹿児島県)", "住吉浜沖(大分県)": "住吉浜沖(大分県)",
                "逗子海岸沖(神奈川県)": "逗子海岸沖(神奈川県)", "津久井浜沖(神奈川県)": "津久井浜沖(神奈川県)",
                "御前崎沖(静岡県)": "御前崎沖(静岡県)", "本栖湖中央(山梨県)": "本栖湖中央(山梨県)",
                "浜名湖村櫛沖(静岡県)": "浜名湖村櫛沖(静岡県)", "甲子園浜沖(兵庫県)": "甲子園浜沖(兵庫県)",
                "柏原沖(鹿児島県)": "柏原沖(鹿児島県)", "磯海岸沖(鹿児島県)": "磯海岸沖(鹿児島県)",
                "江口浜沖(鹿児島県)": "江口浜沖(鹿児島県)", "垂水港(鹿児島県)": "垂水港(鹿児島県)",
                "海潟(鹿児島県)": "海潟(鹿児島県)", "カナハ沖(マウイ島)": "カナハ沖(マウイ島)",
                "ポゾ沖(グランカナリア)": "ポゾ沖(グランカナリア)", "グリュイッサン沖(DEFI)": "グリュイッサン沖(DEFI)",
                "アンスバタ沖(ニューカレドニア)": "アンスバタ沖(ニューカレドニア)", "ニューヨーク(米国)": "ニューヨーク(米国)",
                "ロンドン(英国)": "ロンドン(英国)"
            }
        },
        "en": {
            "表示設定": "Display Settings",
            "⛵Pin_Weather!": "⛵Pin_Weather!",
            "LABEL_FAV_ADD": "⭐ Add My Spots",
            "LABEL_FAV_OK": "✅ My Spots Registered",
            "FAV_PREFIX": "📍 ",
            "MAP_SELECT_LABEL": "Select on Map",
            "BTN_SEARCH_CITY": "🔍 Search City",
            "BTN_CURRENT_LOC": "🔄📍GPS          ",
            "MSG_GETTING_LOC": "🛰️ Getting current location...",
            "MSG_IDENTIFY_LOC": "Identifying location name...",
            "ERR_LOC_FAILED": "❌ Failed to get location information.",
            "BTN_UPDATE": "Update",
            "BTN_MAP": "🗺️Map",
            "BTN_CURRENT_LOC_SHORT": "📍GPS",
            "SELECT_PLACE": "Select a location",
            "HELP_FAV_SAVED": "Saved to Favorites",
            "HELP_FAV_SAVE": "Add to Favorites",
            "MSG_GEN_GRAPH": "Generating graphs...",
            "⚙ 詳細設定": "⚙ Advanced Settings",
            "📍 My Spots 編集": "📍 Edit My Spots",
            "🚨 My Spots の登録制限（10件）に達しています。": "🚨 My Spots limit (10 items) reached.",
            "「My Spots 編集」から不要な地点を削除してください。": "Please delete unnecessary spots from 'My Spots Editor'.",
            "この地点を My Spots に保存します。": "Save this location to My Spots.",
            "現在": "Current",
            "My Spots の名称確認": "Confirm Favorite Name",
            "登録名（修正可）": "Registration Name",
            "OK（保存実行）": "OK (Save)",
            "登録されている地点はありません。": "No locations registered.",
            "登録済": "Registered",
            "名前を変更": "Edit Name",
            "保存": "Save",
            "戻る": "Back",
            "削除しますか？": "Delete this?",
            "削除": "Delete",
            "中止": "Cancel",
            "グラフ表示設定の詳細": "Detailed Display Settings",
            "デザイン微調整": "Design Adjustment", # 新規
            "風向・風速グラフ表示": "Show Wind Speed/Dir",
            "気温グラフ表示": "Show Temperature",
            "潮位グラフ表示": "Show Tide Level",
            "波高グラフ表示": "Show Wave Height",
            "海面水温グラフ表示": "Show Sea Surface Temperature",
            "天気文字表示": "Show Weather Text",
            "風向名表示": "Show Wind Dir Name",
            "グラフ枠横幅 (inch)": "Graph Width (inch)",
            "グラフ枠縦幅 (inch)": "Graph Height (inch)",
            "グラフ横幅": "Graph Width",   # スライダー用
            "グラフ縦幅": "Graph Height",  # スライダー用
            "上余白": "Top Margin",      # スライダー用
            "上下間隔": "V-Spacing",      # スライダー用
            "左余白": "Left Margin",     # スライダー用
            "グラフ内文字サイズ": "Graph Font Size",
            "フォントサイズ": "Font Size", # スライダー用
            "軸ラベル文字サイズ": "Axis Label Size",
            "危険風速ライン(m/s)": "Danger Wind (m/s)",
            "色付風向選択": "Colored Wind Dir",
            "開発用詳細設定": "Developer Settings",
            "コンテナ最小幅 (px)": "Min Width (px)",
            "解像度 (DPI)": "Resolution (DPI)",
            "グラフ間余白": "Graph Spacing",
            "ラベル距離": "Label Distance",
            "地図ダイアログ調整": "Map Dialog Adjust",
            "地図ダイアログ横余白 (H-Gap)": "Map H-Gap",
            "地図ダイアログ縦余白 (V-Gap)": "Map V-Gap",
            "My Spots 編集ダイアログ調整": "My Spots Edit Adjust",
            "ボタン幅 (%)": "Button Width (%)",
            "地名表示制限 (文字)": "Name Length Limit",
            "降水量・アイコン位置調整": "Precip/Icon Adjust",
            "降水量ラベル高さ": "Precip Label Y",
            "天気アイコン下余白": "Icon Bottom Margin",
            "グラフ縦比率設定": "Graph Ratio Settings",
            "比率:風向": "Ratio: Wind",
            "比率:気温": "Ratio: Temp",
            "比率:潮位": "Ratio: Tide",
            "初期設定に戻す": "Reset to Default",
            "リセット": "Reset", # 追加
            "デフォルトに戻す": "Restore Default", # 追加
            "更新": "Update", 
            "キャンセル": "Cancel",
            "現在の登録地点 (クリックで削除)": "Current My Spots (Click to delete)",
            "--- 地点の追加 ---": "--- Add New Spot ---",
            "地名を入力": "Enter Name",
            "緯度": "Lat",
            "経度": "Lon",
            "地点を追加": "Add Spot",
            "閉じる": "Close",
            "📍 地図指定": "📍 Select on Map",            
            "地図中心に📍": "📍 Pin to Center",
            "確定": "Confirm",
            "場所を検索": "Search location...",
            "検索": "Search",
            "検索中...": "Searching...",
            "見つかりませんでした": "Location not found",
            "地図表示切替": "Switch View",
            "標準": "Standard (OSM)",
            "シンプル": "Simple (White)",
            "ダーク": "Dark (Black)",
            "道路図": "Streets",
            "衛星写真": "Satellite",
            "地名取得中...": "Fetching name...",
            "指定地点": "Custom Location",
            "風速 (m/s)": "Wind Speed (m/s)",
            "気温 (℃)": "Temp (℃)",
            "潮位 (cm)": "Tide (cm)",
            "波高 (cm)": "Wave (cm)",
            "海水温 (℃)": "Sea Surf.(℃)",
            "降水量mm　": "Precip (mm) ",
            "天気": "Weather",
            "OCEAN_INFO": "*Showing marine data from {res_dir} approx. {dist_km}km away.",
            "OCEAN_NONE": "*No marine data within 30km.",
            "LEGEND_TITLE": "📊 Legend:",
            "LEGEND_BLUE": "3-5m/s (Blue)",
            "LEGEND_ORANGE": "5-10m/s (Orange)",
            "LEGEND_RED": "Over 10m/s (Red)",
            "LEGEND_DANGER_LINE": "[Red Dash: Danger Line {v}m/s]",
            "LEGEND_NOTE": "*Blue/Orange bars are shown only for directions selected in Advanced Settings.",
            "DISCLAIMER": "*Data are forecasts. Check official reports and use at your own risk.",
            "LINK_WEATHER": "Weather Forecast API Data",
            "LINK_MARINE": "Marine Weather API Data",
            "WEEKS": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "WEATHER_TEXT": {"晴": "Sunny", "霧": "Fog", "雨": "Rain", "雪": "Snow", "雷": "T-Storm", "？": "?"},
            "ALL_DIRECTIONS": ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"],
            "DIRECTIONS_8": ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
            "NORTH":"N",
            "LOCATIONS": {
                "高須沖(鹿児島県)": "Takasu-oki (Kagoshima)", "ユクサ沖(鹿児島県)": "YUKUSA-oki (Kagoshima)", "住吉浜沖(大分県)": "Sumiyoshihama-oki (Oita)",
                "逗子海岸沖(神奈川県)": "Zushi Beach (Kanagawa)", "津久井浜沖(神奈川県)": "Tsukuiahama-oki (Kanagawa)",
                "御前崎沖(静岡県)": "Omaezaki-oki (Shizuoka)", "本栖湖中央(山梨県)": "Lake Motosu (Yamanashi)",
                "浜名湖村櫛沖(静岡県)": "Lake Hamana Murakushi (Shizuoka)", "甲子園浜沖(兵庫県)": "Koshienhama-oki (Hyogo)",
                "柏原沖(鹿児島県)": "Kashivara-oki (Kagoshima)", "磯海岸沖(鹿児島県)": "Iso Beach (Kagoshima)",
                "江口浜沖(鹿児島県)": "Eguchihama-oki (Kagoshima)", "垂水港(鹿児島県)": "Tarumizu Port (Kagoshima)",
                "海潟(鹿児島県)": "Kaigata (Kagoshima)", "カナハ沖(マウイ島)": "Kanaha (Maui)",
                "ポゾ沖(グランカナリア)": "Pozo (Gran Canaria)", "グリュイッサン沖(DEFI)": "Gruissan (DEFI)",
                "アンスバタ沖(ニューカレドニア)": "Anse Vata (New Caledonia)", "ニューヨーク(米国)": "New York (USA)",
                "ロンドン(英国)": "London (UK)"
            }
        }
    }

# ======================================================================================
# 12_1. アプリケーション初期化サブルーチン
# ======================================================================================
def initialize_app_settings():
    """
    アプリの基本設定を整理するサブルーチン。
    Flaskではテンプレート側で設定を行うため、ここではパスの確認等を行います。
    """
    import os
    
    config = {
        "page_title": "Pin_Weather!",
        "icon_path": "static/pin_weather_01.png", # Flaskでは static フォルダに置くのが一般的です
        "default_icon": "⛵"
    }
    
    # 画像の存在確認（デバッグ用）
    if not os.path.exists(config["icon_path"]):
        # static フォルダがない場合などのフォールバック
        config["icon_path"] = None 

    return config

# ======================================================================================
# 13. 日本語フォントセットアップサブルーチン (Render/Linux 強化版)
# ======================================================================================
def setup_font(font_size=None):
    """
    matplotlib の描画エンジンに対して、直接日本語フォントを注入します。
    """
    import os
    import matplotlib as mpl
    import matplotlib.font_manager as fm
    import matplotlib.pyplot as plt

    # 1. サイズの決定
    if font_size is None:
        try:
            font_size = CONFIG.get("GRAPH_FONT_SIZE", 9)
        except:
            font_size = 9
    
    # 2. フォントファイルのパス指定
    # static 直下の font.ttf を絶対パスで確実に指定
    base_dir = os.path.dirname(__file__)
    font_path = os.path.abspath(os.path.join(base_dir, 'static', 'font.ttf'))
    
    if os.path.exists(font_path):
        try:
            # フォントをキャッシュを介さず直接追加
            fm.fontManager.addfont(font_path)
            prop = fm.FontProperties(fname=font_path)
            font_name = prop.get_name()
            
            # --- ここが最重要：matplotlib全体のデフォルトを強制上書き ---
            plt.rcParams['font.family'] = font_name
            plt.rcParams['font.size'] = font_size
            # グラフ内の細かいフォント設定も念のため上書き
            mpl.rc('font', family=font_name)
            
            # マイナス記号の文字化け防止
            plt.rcParams['axes.unicode_minus'] = False
            
            # キャッシュによる不具合を防ぐため、今の描画オブジェクトにも適用
            plt.gca().title.set_fontproperties(prop)
            
            print(f"Font successfully applied: {font_name}")
            return prop # 呼び出し元で個別に使いたい場合のために返す
        except Exception as e:
            print(f"Font Apply Error: {e}")
    else:
        print(f"Font file NOT FOUND at: {font_path}")
    
    return None


# ======================================================================================
# 14. 気象データをAPIから取得するサブルーチン (キャッシュ対応)
# ======================================================================================
def fetch_weather_data(lat, lon, days):
    CACHE_DIR = "weather_cache"
    if not os.path.exists(CACHE_DIR): 
        try:
            os.makedirs(CACHE_DIR)
        except Exception as e:
            raise RuntimeError(f"【フォルダ作成失敗】キャッシュ用フォルダを作れません: {e}")
    
    file_id = f"{round(lat, 2)}_{round(lon, 2)}"
    cache_file = os.path.join(CACHE_DIR, f"spot_{file_id}.csv")
    meta_file = os.path.join(CACHE_DIR, f"spot_{file_id}.meta")
    
    if os.path.exists(cache_file) and os.path.exists(meta_file):
        if (time.time() - os.path.getmtime(cache_file)) < 3600:
            try:
                df_cache = pd.read_csv(cache_file, parse_dates=['time'])
                with open(meta_file, "r") as f:
                    offset = int(f.read())
                df_cache.attrs['local_offset_seconds'] = offset
                return df_cache
            except: pass

    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation&timezone=auto&wind_speed_unit=ms&forecast_days={days}"
    
    try:
        res_raw = requests.get(url, timeout=10)
        if res_raw.status_code != 200:
            raise RuntimeError(f"【API取得失敗】Open-Meteo APIがエラーを返しました (HTTP {res_raw.status_code})")

        response = res_raw.json()
        df = pd.DataFrame(response["hourly"])
        
        local_offset_s = response.get("utc_offset_seconds", 0)
        df['time'] = pd.to_datetime(df['time']).dt.tz_localize(None)
        df.attrs['local_offset_seconds'] = local_offset_s
        
        def get_icon(code):
            if code == 0: return "☀️"
            if code <= 3: return "🌤️"
            if code == 45 or code == 48: return "🌫️"
            if code <= 67: return "☔"
            if code <= 77: return "❄️"
            if code <= 82: return "🌦️"
            if code <= 86: return "🌨️"
            if code <= 99: return "⛈️"
            return "❓"
        df['weather_icon'] = df['weather_code'].apply(get_icon)

        try:
            df.to_csv(cache_file, index=False)
            with open(meta_file, "w") as f: f.write(str(local_offset_s))
        except PermissionError:
            raise RuntimeError(f"【アクセス拒否】キャッシュファイル '{cache_file}' が開かれています。")
        except Exception as e:
            raise RuntimeError(f"【保存失敗】キャッシュデータの保存に失敗しました: {e}")

        return df
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"【通信エラー】APIに接続できませんでした: {e}")
    except Exception as e:
        raise RuntimeError(f"【システムエラー】予期せぬエラーが発生しました: {e}")

# ======================================================================================
# 15. 気象データキャッシュファイルを物理削除するサブルーチン
# ======================================================================================
def clear_weather_cache_files():
    import shutil
    CACHE_DIR = "weather_cache"
    if os.path.exists(CACHE_DIR):
        try:
            shutil.rmtree(CACHE_DIR)
            return True, "✅ キャッシュファイルを削除しました。"
        except Exception as e:
            return False, f"❌ 削除失敗: {e}"
    else:
        return False, "削除対象のキャッシュファイルはありません。"

# ======================================================================================
# 16. 海洋データを取得するサブルーチン
# ======================================================================================
def get_marine_data(time_series, lat, lon):
    # APIリクエスト用パラメータ
    url = "[https://marine-api.open-meteo.com/v1/marine](https://marine-api.open-meteo.com/v1/marine)"
    params = {
        "latitude": round(float(lat), 4),
        "longitude": round(float(lon), 4),
        "hourly": "wave_height,sea_surface_temperature,sea_level_height_msl",
        "timezone": "auto",
        "forecast_days": "9",        # 確実に9日分を指定
        "cell_selection": "sea"      # 海洋データを優先取得
    }
    
    try:
        res = requests.get(url, params=params, timeout=10).json()
        if "hourly" not in res:
            return None, lat, lon
        
        # API取得データをDataFrame化
        m_df = pd.DataFrame(res["hourly"])
        m_df['time'] = pd.to_datetime(m_df['time']).dt.tz_localize(None)
        
        # 実際にデータが取得された座標を保持
        res_lat = res.get("latitude", lat)
        res_lon = res.get("longitude", lon)
        
        # 渡された時間軸(time_series)に取得データをマージして整合性を確保
        time_df = pd.DataFrame({'time': [t.replace(tzinfo=None) for t in time_series]})
        merged = pd.merge(time_df, m_df, on='time', how='left')
        
        # 結果を辞書形式で抽出
        results = {
            "wave": merged['wave_height'].tolist(),
            "temp": merged['sea_surface_temperature'].tolist(),
            "tide": merged['sea_level_height_msl'].tolist()
        }
        
        # 全データが空（すべてNone）でないか確認
        if all(x is None for x in results["wave"]) and all(x is None for x in results["tide"]):
            return None, res_lat, res_lon
    
        return results, res_lat, res_lon
    except Exception as e:
        print(f"Marine API Error: {e}")
        return None, lat, lon
# ======================================================================================
# 17. 天気コードからテキストと色を取得するサブルーチン
# ======================================================================================
def get_weather_info(code):
    from flask import session
    translations = get_language_dict()
    current_lang = session.get('lang', 'ja')
    lang_dict = translations[current_lang]

    if pd.isna(code): return "", "black"
    if code <= 3: return lang_dict.get("晴", "Clear"), "#FF4500" 
    if code == 45 or code == 48: return lang_dict.get("霧", "Fog"), "#708090" 
    if code <= 67: return lang_dict.get("雨", "Rain"), "#00008B" 
    if code <= 77: return lang_dict.get("雪", "Snow"), "#00BFFF" 
    if code <= 82: return lang_dict.get("雨", "Rain"), "#00008B"
    if code <= 86: return lang_dict.get("雪", "Snow"), "#00BFFF"
    if code <= 99: return lang_dict.get("雷", "Storm"), "#8B0000" 
    return "？", "black"

# ======================================================================================
# 20. 風向き・速度・色の判定を行うデータ処理サブルーチン (型不一致解消・完全版)
# ======================================================================================
def process_wind_data(df, target_dirs_input):
    import pandas as pd

    # 1. 内部判定用の方位リスト (idx = int((deg + 11.25) / 22.5) % 16 に準拠)
    # 0:北, 1:北北東, 2:北東, ... 15:北北西
    internal_dirs = ["北", "北北東", "北東", "東北東", "東", "東南東", "南東", "南南東", 
                     "南", "南南西", "南西", "西南西", "西", "西北西", "北西", "北北西"]
    
    arrows = ["↓", "↙", "↙", "↙", "←", "↖", "↖", "↖", "↑", "↗", "↗", "↗", "→", "↘", "↘", "↘"]

    # 2. 入力データの型判定と「方位名リスト」への変換
    # Flaskのsession['sel_dirs']が [True, False...] のリストで送られてくるケースに対応
    target_names = []
    if isinstance(target_dirs_input, (list, tuple)):
        if len(target_dirs_input) > 0 and isinstance(target_dirs_input[0], bool):
            # True/Falseのリストから、Trueの位置に対応する方位名を抽出
            target_names = [internal_dirs[i] for i, val in enumerate(target_dirs_input) if val and i < len(internal_dirs)]
        else:
            # すでに文字列（「北」など）のリストである場合
            target_names = list(target_dirs_input)

    def get_info(deg):
        if pd.isna(deg): return "", ""
        idx = int((deg + 11.25) / 22.5) % 16
        return internal_dirs[idx], arrows[idx]
    
    res_data = df['wind_direction_10m'].apply(get_info)
    df['dir_name'] = [r[0] for r in res_data] 
    df['arrow']    = [r[1] for r in res_data]
    
    try:
        weather_res = df['weather_code'].apply(get_weather_info)
        df['w_text'] = [r[0] for r in weather_res]
        df['w_color'] = [r[1] for r in weather_res]
    except:
        df['w_text'] = ""
        df['w_color'] = "black"
    
    def judge(row):
        speed = row['wind_speed_10m']
        if pd.isna(speed): return "#D3D3D3"
        
        # 強風判定 (10m/s以上)
        if speed >= 10.0: return "crimson"
        
        # 方位着色判定 (変換した target_names と比較)
        if row['dir_name'] in target_names:
            if 5.0 <= speed < 10.0: return "orange"
            if 3.0 <= speed < 5.0: return "skyblue"
            
        return "#D3D3D3"
    
    df['color'] = df.apply(judge, axis=1)
    return df

# ======================================================================================
# 21. X軸の表示形式（日付・時刻）を定義するサブルーチン
# ======================================================================================
def get_x_axis_formatter():
    import matplotlib.dates as mdates
    from flask import session

    current_lang = session.get('lang', 'ja')
    translations = get_language_dict()
    lang_dict = translations[current_lang]
    weeks = lang_dict.get("WEEKS", ["月", "火", "水", "木", "金", "土", "日"])

    def formatter(x, p):
        dt = mdates.num2date(x)
        if dt.hour == 0:
            day_str = dt.strftime('%m/%d')
            week_str = f"({weeks[dt.weekday()]})"
            return f"{day_str}\n{week_str}"
        else:
            return dt.strftime('%H') + '\n '
            
    return formatter

# ======================================================================================
# 22. グラフの共通軸設定を適用するサブルーチン
# ======================================================================================
def apply_common_axis_settings(ax, df, formatter, now_jst, design_params):
    import matplotlib.dates as mdates
    import matplotlib.pyplot as plt
    from datetime import timedelta
    from flask import session

    translations = get_language_dict()
    current_lang = session.get('lang', 'ja')
    lang_dict = translations[current_lang]
    weeks = lang_dict.get("WEEKS", ["月", "火", "水", "木", "金", "土", "日"])
    sat_label = weeks[5]
    sun_label = weeks[6]

    browser_offset = now_jst.utcoffset()
    browser_offset_s = browser_offset.total_seconds() if browser_offset else 0
    local_offset_s = df.attrs.get('local_offset_seconds', 0)
    draw_now = now_jst.replace(tzinfo=None) - timedelta(seconds=browser_offset_s) + timedelta(seconds=local_offset_s)

    ax.axvline(draw_now, color='blue', linestyle='-', alpha=0.6, linewidth=CONFIG["VLINE_WIDTH"])
    ax.xaxis.set_major_locator(mdates.HourLocator(byhour=range(0, 24, 3)))
    ax.xaxis.set_major_formatter(plt.FuncFormatter(formatter))
    ax.xaxis.set_minor_locator(mdates.HourLocator(interval=1))
    ax.set_xlim(df['time'].iloc[0], df['time'].iloc[-1])
    ax.grid(True, which='major', linestyle=':', alpha=0.6, color='#000000')
    ax.grid(True, which='minor', linestyle=':', alpha=0.2, color='#888888')
    
    l_size = design_params.get("label_font_size", CONFIG["LABEL_SIZE"])
    l_pad = design_params.get("label_pad", CONFIG["LABEL_PAD"])
    ax.tick_params(axis='x', which='major', labelsize=l_size, pad=l_pad)
    ax.tick_params(axis='y', labelsize=l_size)

    fig = ax.figure
    fig.canvas.draw()
    labels = ax.get_xticklabels()
    for label in labels:
        text = label.get_text()
        if '(' in text:
            if sat_label in text or sun_label in text:
                label.set_color('red')
            else:
                label.set_color('blue')

# ======================================================================================
# 23. 風速棒グラフを描画するサブルーチン (降水量：0より大きい場合に小数点1位表示)
# ======================================================================================
def render_wind_bar_chart(ax, df, danger_v, wind_step, design_params=None):
    import pandas as pd
    from flask import session

    translations = get_language_dict()
    current_lang = session.get('lang', 'ja')
    lang_dict = translations[current_lang]

    bar_width = design_params.get("bar_width", 0.035) if design_params else 0.035
    bar_colors = df['color'] if 'color' in df.columns else CONFIG.get("ARROW_COLOR", "blue")
    bars = ax.bar(df['time'], df['wind_speed_10m'], color=bar_colors, alpha=0.9, width=bar_width)
    ax.axhline(y=danger_v, color='red', linestyle='--', linewidth=CONFIG["HLINE_WIDTH"], alpha=0.8)
    
    fs = design_params.get("base_font_size", CONFIG["GRAPH_FONT_SIZE"])
    l_fs = design_params.get("label_font_size", CONFIG["LABEL_SIZE"])
    precip_y = design_params.get("precip_y", CONFIG["DEFAULT_PRECIP_Y"])
    
    step = fs * 0.144 
    base = step * 0.5
    show_w = design_params.get("show_w_text", CONFIG["SHOW_W_TEXT"])
    show_d = design_params.get("show_dir_name", CONFIG["SHOW_DIR_NAME"])
    
    max_speed = df['wind_speed_10m'].max() if not df['wind_speed_10m'].dropna().empty else 0
    y_limit = max(max_speed + (4 * step) + 1.0, danger_v + 3.0)
    ax.set_ylim(0, y_limit)
    ax.set_ylabel(lang_dict.get('風速 (m/s)', 'Wind Speed (m/s)'), fontsize=l_fs) 

    graph_left_time = df['time'].iloc[0] 
    precip_label = lang_dict.get("降水量mm　", "Precip. ")
    ax.text(graph_left_time, precip_y, precip_label, 
            ha='right', va='bottom', fontsize=l_fs, color="blue", 
            transform=ax.get_xaxis_transform(), clip_on=False)
    
    for i, bar in enumerate(bars):
        if i < 3: continue
        row = df.iloc[i]
        dt = row['time']
        x_pos = bar.get_x() + bar.get_width()/2.

        if (i - 3) % wind_step == 0:
            if pd.isna(row['wind_speed_10m']): continue
            base_y = bar.get_height()
            ax.text(x_pos, base_y + base, f"{row['wind_speed_10m']:.0f}", ha='center', va='bottom', fontsize=fs-2)
            current_y = base_y + base + step
            arrow_icon = row.get('arrow', '')
            if arrow_icon:
                ax.text(x_pos, current_y, arrow_icon, ha='center', va='bottom', 
                        fontsize=fs+2, fontweight='bold', color=CONFIG["ARROW_COLOR"])
            if show_d:
                current_y += step
                dir_name = row.get('dir_name', '')
                if dir_name:
                    ax.text(x_pos, current_y, dir_name, ha='center', va='bottom', fontsize=fs-2)
            if show_w:
                current_y += step
                w_text = row.get('w_text', '')
                if w_text:
                    ax.text(x_pos, current_y, w_text, ha='center', va='bottom', 
                            color=row.get('w_color', 'black'), fontweight='bold', fontsize=fs-1)

        if (i - 3) % 3 == 0:
            precip = row.get('precipitation', 0)
            if pd.notna(precip):
                # 0より大きい場合のみ、小数点第1位まで表示
                if precip > 0:
                    ax.text(dt, precip_y, f"{precip:.1f}", ha='center', va='bottom', 
                            fontsize=l_fs, color="blue", transform=ax.get_xaxis_transform(), clip_on=False)

# ======================================================================================
# 24. 気温グラフを描画するサブルーチン (整数表示)
# ======================================================================================
def render_temp_line_chart(ax, df):
    import pandas as pd
    from flask import session
    current_lang = session.get('lang', 'ja')
    translations = get_language_dict()
    lang_dict = translations[current_lang]
    label_fs = int(session.get("label_font_size", CONFIG["LABEL_SIZE"]))

    ax.plot(df['time'], df['temperature_2m'], color=CONFIG["TEMP_COLOR"], linewidth=2, marker='o', markersize=3, markevery=3)
    ax.set_ylabel(lang_dict.get('気温 (℃)', 'Temp. (°C)'), fontsize=label_fs)
    
    t_max = df['temperature_2m'].max()
    t_min = df['temperature_2m'].min()
    y_range = t_max - t_min if t_max != t_min else 1.0
    ax.set_ylim(t_min - (y_range * 0.1), t_max + (y_range * 0.1))

    for i in range(len(df)):
        dt = df['time'].iloc[i]
        temp = df['temperature_2m'].iloc[i]
        if not pd.isna(temp) and (dt.hour % 3 == 0):
            ax.text(dt, 1.02, f"{temp:.0f}", ha='center', va='bottom', 
                    fontsize=label_fs, color=CONFIG["TEMP_COLOR"], 
                    transform=ax.get_xaxis_transform(), clip_on=False)

# ======================================================================================
# 25. 波高グラフを描画するサブルーチン (整数cm・四捨五入・マイナス対応版)
# ======================================================================================
def render_wave_height_chart(ax, df, lat, lon, marine_results, res_lat, res_lon, is_bottom=False):
    import numpy as np
    import pandas as pd
    from flask import session
    current_lang = session.get('lang', 'ja')
    translations = get_language_dict()
    lang_dict = translations[current_lang]
    label_fs = int(session.get("label_font_size", CONFIG.get("LABEL_SIZE", 10)))

    if marine_results is None or "wave" not in marine_results:
        ax.clear()
        ax.set_axis_off()
        no_data_msg = lang_dict.get("OCEAN_NONE", "※指定地点の近傍に有効な海洋データがないため表示されません")
        ax.text(0.0, 0.5, no_data_msg, transform=ax.transAxes, color="gray", fontsize=label_fs, ha='left', va='center')
        return

    # 波高(m)をcmに変換し、四捨五入を適用。マイナスの値もそのまま維持します。
    # np.roundを使用して、ベクトル演算で一括して四捨五入整数を作成
    raw_waves = np.array([v if v is not None else np.nan for v in marine_results["wave"]])
    df['wave_cm'] = np.round(raw_waves * 100)

    ax.plot(df['time'], df['wave_cm'], color="#2ca02c", linewidth=2, marker='o', markersize=3, markevery=3)
    ax.set_ylabel(lang_dict.get("波高 (cm)", "Wave (cm)"), fontsize=label_fs)
    ax.grid(True, axis='y', linestyle='--', alpha=0.5)

    # 数値ラベルの描画
    for i in range(0, len(df), 3):
        dt, val = df['time'].iloc[i], df['wave_cm'].iloc[i]
        if not pd.isna(val):
            # 0の場合は非表示 (Excel 0;;# 相当のロジックを適用)
            if val != 0:
                ax.text(dt, 1.05, f"{val:.0f}", ha='center', va='bottom', color="#2ca02c", 
                        fontsize=label_fs, transform=ax.get_xaxis_transform())

    if is_bottom:
        render_ocean_location_info(ax, lat, lon, res_lat, res_lon, label_fs, lang_dict)

# ======================================================================================
# 26. 海面水温グラフを描画するサブルーチン (整数表示・地点情報下げ)
# ======================================================================================
def render_ocean_temp_chart(ax, df, lat, lon, marine_results, res_lat, res_lon, is_bottom=False):
    import numpy as np
    import pandas as pd
    from flask import session
    current_lang = session.get('lang', 'ja')
    translations = get_language_dict()
    lang_dict = translations[current_lang]
    label_fs = int(session.get("label_font_size", CONFIG.get("LABEL_SIZE", 10)))

    if marine_results is None or "temp" not in marine_results:
        ax.clear()
        ax.set_axis_off()
        no_data_msg = lang_dict.get("OCEAN_NONE", "※指定地点の近傍に有効な海洋データがないため表示されません")
        ax.text(0.0, 0.5, no_data_msg, transform=ax.transAxes, color="gray", fontsize=label_fs, ha='left', va='center')
        return

    df['ocean_temp'] = [v if v is not None else np.nan for v in marine_results["temp"]]
    ax.plot(df['time'], df['ocean_temp'], color="#ff7f0e", linewidth=2, marker='o', markersize=3, markevery=3)
    ax.set_ylabel(lang_dict.get("海水温 (℃)", "Water (°C)"), fontsize=label_fs)
    ax.grid(True, axis='y', linestyle='--', alpha=0.5)

    for i in range(0, len(df), 3):
        dt, val = df['time'].iloc[i], df['ocean_temp'].iloc[i]
        if not pd.isna(val):
            ax.text(dt, 1.05, f"{val:.0f}", ha='center', va='bottom', color="#ff7f0e", 
                    fontsize=label_fs, transform=ax.get_xaxis_transform())

    if is_bottom:
        render_ocean_location_info(ax, lat, lon, res_lat, res_lon, label_fs, lang_dict)

# ======================================================================================
# 27. 潮位グラフを描画するサブルーチン (地点情報呼び出し含む)
# ======================================================================================
def render_tide_curve_chart(ax, df, lat, lon, marine_results, res_lat, res_lon, is_bottom=False):
    import numpy as np
    import pandas as pd
    from flask import session
    current_lang = session.get('lang', 'ja')
    translations = get_language_dict()
    lang_dict = translations[current_lang]
    label_fs = int(session.get("label_font_size", CONFIG.get("LABEL_SIZE", 10)))

    tide_levels = marine_results["tide"] if marine_results and "tide" in marine_results else None

    if tide_levels is None:
        ax.clear()
        ax.set_axis_off()
        no_data_msg = lang_dict.get("OCEAN_NONE", "※指定地点の近傍に有効な海洋データがないため表示されません")
        ax.text(0.0, 0.5, no_data_msg, transform=ax.transAxes, color="gray", fontsize=label_fs, ha='left', va='center')
        return

    df['tide_cm'] = [v * 100 if v is not None else np.nan for v in tide_levels]
    ax.plot(df['time'], df['tide_cm'], color="#1f77b4", linewidth=2, marker='o', markersize=3, markevery=3)
    ax.set_ylabel(lang_dict.get("潮位 (cm)", "Tide (cm)"), fontsize=label_fs)
    ax.grid(True, axis='y', linestyle='--', alpha=0.5)

    for i in range(0, len(df), 3):
        dt, val = df['time'].iloc[i], df['tide_cm'].iloc[i]
        if not pd.isna(val):
            # 整数表示
            ax.text(dt, 1.05, f"{val:.0f}", ha='center', va='bottom', color="#1f77b4", 
                    fontsize=label_fs, transform=ax.get_xaxis_transform())

    if is_bottom:
        render_ocean_location_info(ax, lat, lon, res_lat, res_lon, label_fs, lang_dict)

# ======================================================================================
# 28. 海洋データの地点情報を描画するサブルーチン (位置自動計算・多言語対応版)
# ======================================================================================
def render_ocean_location_info(ax, lat, lon, res_lat, res_lon, label_fs, lang_dict):
    """
    指定地点とAPI取得地点の距離・方位を計算し、グラフ下部に重ならないよう自動配置します。
    """
    import numpy as np
    from matplotlib.transforms import ScaledTranslation

    # 1. 距離の近似計算 (km)
    dx = (res_lon - lon) * 111 * np.cos(np.radians(lat))
    dy = (res_lat - lat) * 111
    dist_km = round(np.sqrt(dx**2 + dy**2), 1)

    # 2. 0.5km以上の乖離がある場合のみ表示
    if dist_km >= 0.5:
        # 方位角の計算 (北を0度として時計回り)
        angle = np.degrees(np.arctan2(dx, dy))
        # 多言語辞書から8方位を取得 (デフォルトは日本語)
        base_dirs = lang_dict.get("DIRECTIONS_8", ["北", "北東", "東", "南東", "南", "南西", "西", "北西"])
        # 360度を45度刻みで判定
        res_dir = base_dirs[int(((angle + 22.5) % 360) // 45)]
        
        # 多言語辞書からメッセージテンプレートを取得
        # 辞書にない場合はデフォルトの日本語フォーマットを使用
        msg_tmpl = lang_dict.get("OCEAN_INFO", "※データ地点: {res_dir}方向に約{dist_km}km")
        info_text = msg_tmpl.format(res_dir=res_dir, dist_km=dist_km)
        
        # 3. テキスト位置の動的オフセット設定
        # label_fs（フォントサイズ）に基づき、インチ単位で位置を計算します。
        # これにより、グラフの高さが変わっても文字が重なりません。
        # 72は1インチあたりのポイント数。3.5は行間調整係数です。
        offset_in_points = - (label_fs * 3.6)
        offset_trans = ScaledTranslation(0, offset_in_points / 72, ax.figure.dpi_scale_trans)
        
        # 表示実行
        ax.text(0.01, 0.0, info_text, 
                transform=ax.transAxes + offset_trans, 
                color="#d62728", 
                fontsize=label_fs - 1, 
                ha='left', 
                va='top')

# ======================================================================================
# 29. 天気アイコン部分のHTMLを生成するサブルーチン (はみ出し防止・連動修正版)
# ======================================================================================
def generate_weather_icons_html(df, ratio_info, contena_min_w, start_idx, design_params):
    import pandas as pd
    
    # 1. デザインパラメータから上余白(inch)を取得し、ピクセルに変換
    top_margin_inch = design_params.get("top_margin_inch", 0.0)
    margin_px = int(top_margin_inch * 96)
    
    # 2. 基本サイズの設定
    base_height = 45      # アイコン行の標準高さ
    icon_size_px = 28     # アイコン自体のサイズ
    header_fs_px = 14     # 「天気」文字のサイズ

    # 3. レイアウトの計算
    # 枠を削るのではなく、表示位置をオフセットさせる
    # dynamic_height は 30px 程度を最小値として確保（アイコンが消えないように）
    display_height = max(30, base_height + (margin_px if margin_px > 0 else 0))
    
    # マイナス設定時は、外枠の下マージンをマイナスにしてグラフを吸い寄せる
    negative_margin_bottom = margin_px if margin_px < 0 else 0

    right_img_w_px = ratio_info[0]
    hour_w_px = ratio_info[1]
    plot_offset_px = ratio_info[2]
    
    # 左側の「天気」ラベル
    header_html = f'''
        <div style="font-size:{header_fs_px}px; height:{display_height}px; line-height:{display_height}px; 
                    text-align:right; padding-right:10px; color:#666; font-weight:bold; 
                    margin-bottom:{negative_margin_bottom}px;">
            {design_params.get("天気", "天気")}
        </div>
    '''
    
    icons_inner = ""
    shift_px = hour_w_px * 3.0  # 3時間シフト

    for i in range(int(start_idx), len(df)):
        if (i - start_idx) % 3 != 0:
            continue
            
        row = df.iloc[i]
        icon = row.get('weather_icon')
        if not icon or pd.isna(icon):
            continue
            
        current_x_px = plot_offset_px + (hour_w_px * (i - start_idx)) + shift_px
        
        # top位置を調整することで、枠が狭まってもアイコンを中央に維持
        icons_inner += f'''
            <div style="position: absolute; left: {current_x_px}px; top: 0; width: {int(hour_w_px)}px; height: {display_height}px; 
                        display: flex; align-items: center; justify-content: center; transform: translateX(-50%);">
                <div style="font-size: {icon_size_px}px; line-height: 1;">{icon}</div>
            </div>
        '''

    # 本体HTML：margin-bottom にマイナス値を設定することで下のグラフを上に引き上げる
    body_html = f'''
        <div style="position: relative; width: {right_img_w_px}px; height: {display_height}px; 
                    background-color: white; border-bottom: 1px solid #f0f0f0; 
                    margin-bottom: {negative_margin_bottom}px;">
            {icons_inner}
        </div>
    '''
    return header_html, body_html

# ======================================================================================
# 30. 高解像度グラフ画像を生成し、左右に分割するサブルーチン (フォント直接指定・完全版)
# ======================================================================================
def generate_high_res_graph(lat, lon, danger_v, selected_dirs_tuple, design_params, now_jst):
    import pandas as pd
    import io, base64, os, sys
    import numpy as np
    from datetime import timedelta
    import matplotlib.pyplot as plt
    from PIL import Image
    import matplotlib.font_manager as fm

    df = pd.DataFrame()
    start_idx = 0
    split_px = 0
    new_ratio_info = (0.0, 0.0, 0.0)

    try:
        # --- 1. フォントオブジェクトの絶対パス生成 ---
        base_dir = os.path.dirname(os.path.abspath(__file__))
        fpath = os.path.join(base_dir, 'static', 'font.ttf')
        f_size = design_params.get("font_size", 10)
        
        # フォントオブジェクトを生成 (各描画関数でこれを使います)
        if os.path.exists(fpath):
            # fm.FontProperties を生成
            fp = fm.FontProperties(fname=fpath, size=f_size)
            # 念のため全体設定も行うが、今回は個別指定を優先する
            fm.fontManager.addfont(fpath)
            plt.rcParams['font.family'] = fp.get_name()
        else:
            # 異常系：ファイルがない場合は標準フォント
            fp = fm.FontProperties(family='sans-serif', size=f_size)

        plt.rcParams['axes.unicode_minus'] = False

        # --- 2. データ取得 ---
        df_raw = fetch_weather_data(lat, lon, 9)
        if df_raw is None or df_raw.empty:
            raise RuntimeError("気象データの取得に失敗しました。")

        # --- 3. 時差・切り出し ---
        local_offset_s = df_raw.attrs.get('local_offset_seconds', 0)
        browser_offset = now_jst.utcoffset()
        browser_offset_s = browser_offset.total_seconds() if browser_offset else 0
        now_local = now_jst.replace(tzinfo=None) - timedelta(seconds=browser_offset_s) + timedelta(seconds=local_offset_s)
        display_start_time = now_local.replace(hour=(now_local.hour // 3) * 3, minute=0, second=0, microsecond=0)
        padding_start_time = display_start_time - timedelta(hours=3)
        
        df = df_raw[pd.to_datetime(df_raw['time']) >= padding_start_time].copy().reset_index(drop=True)
        df = df.head(195)
        start_idx = 3
        df = process_wind_data(df, list(selected_dirs_tuple))

        # --- 4. 描画項目の決定 ---
        active_plots = []
        height_ratios = []
        if design_params.get("show_wind", True): active_plots.append("wind"); height_ratios.append(4)
        if design_params.get("show_temp", True): active_plots.append("temp"); height_ratios.append(1)
        if design_params.get("show_wave", True): active_plots.append("wave"); height_ratios.append(1)
        if design_params.get("show_ocean_temp", True): active_plots.append("ocean_temp"); height_ratios.append(1)
        if design_params.get("show_tide", True): active_plots.append("tide"); height_ratios.append(1)

        # --- 5. 海洋データ準備 ---
        marine_results, r_lat, r_lon = None, lat, lon
        if any(k in active_plots for k in {"wave", "ocean_temp", "tide"}):
            marine_results, r_lat, r_lon = get_marine_data(df['time'], lat, lon)

        # --- 6. サイズ設計 ---
        unit_height_px = 100  
        dpi_value = design_params.get("graph_dpi", 200)
        fig_w_inch = design_params.get("width_inch", 15.0)
        fig_h_inch = (sum(height_ratios) * unit_height_px + 150) / dpi_value
        margin_left_inch = design_params.get("margin_left_inch", 0.8)
        left_margin_ratio = margin_left_inch / fig_w_inch

        # --- 7. グラフ描画 ---
        fig, axes = plt.subplots(len(active_plots), 1, figsize=(fig_w_inch, fig_h_inch), dpi=dpi_value,
                                    gridspec_kw={'height_ratios': height_ratios})
        axes_list = np.array([axes]).flatten()

        formatter = get_x_axis_formatter()
        for i, plot_type in enumerate(active_plots):
            ax = axes_list[i]
            is_bottom = (i == len(active_plots) - 1)
            
            # 各レンダリング関数を呼び出し
            if plot_type == "wind":
                render_wind_bar_chart(ax, df, danger_v, start_idx, design_params)
            elif plot_type == "temp":
                render_temp_line_chart(ax, df)
            elif plot_type == "wave":
                render_wave_height_chart(ax, df, lat, lon, marine_results, r_lat, r_lon, is_bottom)
            elif plot_type == "ocean_temp":
                render_ocean_temp_chart(ax, df, lat, lon, marine_results, r_lat, r_lon, is_bottom)
            elif plot_type == "tide":
                render_tide_curve_chart(ax, df, lat, lon, marine_results, r_lat, r_lon, is_bottom)

            # 共通設定を適用
            apply_common_axis_settings(ax, df, formatter, now_jst, design_params)
            
            # --- ここが豆腐対策の核心：生成した軸ラベルやタイトルに直接フォントを注入 ---
            for text in ax.get_xticklabels() + ax.get_yticklabels():
                text.set_fontproperties(fp)
            ax.set_xlabel(ax.get_xlabel(), fontproperties=fp)
            ax.set_ylabel(ax.get_ylabel(), fontproperties=fp)
            if ax.get_title():
                ax.set_title(ax.get_title(), fontproperties=fp)

        plt.subplots_adjust(left=left_margin_ratio, right=0.98, top=0.92, bottom=0.15, hspace=design_params.get("hspace_inch", 0.4))

        # --- 8. 画像出力 ---
        buf = io.BytesIO()
        fig.savefig(buf, format="png", bbox_inches=None, pad_inches=0, dpi=dpi_value)
        buf.seek(0)
        full_img = Image.open(buf)
        img_w, img_h = full_img.size
        split_px = int(img_w * axes_list[0].get_position().x0)
        new_ratio_info = (float(img_w - split_px), (axes_list[0].get_position().width * img_w) / (len(df) - 1), 0.0)
        plt.close(fig)
        
        left_part = full_img.crop((0, 0, split_px, img_h))
        right_part = full_img.crop((split_px, 0, img_w, img_h))
        
        def img_to_b64(img):
            b = io.BytesIO()
            img.save(b, format="PNG")
            return base64.b64encode(b.getvalue()).decode()

        return img_to_b64(left_part), img_to_b64(right_part), new_ratio_info, start_idx, df, split_px

    except Exception as e:
        if 'fig' in locals(): plt.close(fig)
        raise RuntimeError(str(e))


# ======================================================================================
# 30. グラフの個別高さ(inch)と表示設定を変更するダイアログ (Streamlit版)
# ======================================================================================
def show_settings_dialog():
    """
    表示項目ごとに「表示ON/OFF」と「高さ(inch)」を数値入力できるダイアログ。
    設定値は st.session_state に保存され、ブラウザにも同期されます。
    """
    import streamlit as st

    # 1. 辞書と設定の取得
    translations = get_language_dict()
    lang_dict = translations[st.session_state.lang]
    
    # 表示順序マスター（CONFIG参照）
    master_order = CONFIG.get("GRAPH_ORDER", ["WIND", "TEMP", "WAVE", "OCEAN", "TIDE"])

    @st.dialog(lang_dict.get("グラフ表示設定の詳細", "Graph Settings"), dismissible=False)
    def settings_dialog_content():
        st.subheader("表示項目とグラフの高さ (inch)")
        st.write("※ 高さを大きくすると、そのグラフが縦に引き伸ばされます。")

        # ユーザー入力を一時保持する辞書
        new_settings = {}

        # 2. 各項目ごとに「トグル」と「数値入力」を並べる
        for tid in master_order:
            label = lang_dict.get(tid, tid)
            col1, col2 = st.columns([2, 1])
            
            with col1:
                key_show = f"show_{tid.lower()}"
                default_show = CONFIG.get(f"SHOW_{tid}", True)
                val_show = st.toggle(label, value=st.session_state.get(key_show, default_show), key=f"tgl_{tid}")
                new_settings[key_show] = val_show
            
            with col2:
                key_height = f"height_{tid.lower()}"
                default_h = CONFIG["GRAPH_HEIGHTS"].get(tid, 0.4)
                h_limit = CONFIG.get("SLIDER_HEIGHT", {"min": 0.1, "max": 5.0, "step": 0.1})
                
                val_height = st.number_input(
                    "高さ", 
                    min_value=h_limit["min"], 
                    max_value=h_limit["max"], 
                    value=float(st.session_state.get(key_height, default_h)), 
                    step=h_limit["step"], 
                    key=f"num_{tid}",
                    label_visibility="collapsed"
                )
                new_settings[key_height] = val_height

        st.markdown("---")

        # 3. 保存・キャンセルボタン
        col_ok, col_cancel = st.columns(2)
        with col_ok:
            if st.button("更新", use_container_width=True, type="primary"):
                st.session_state.update(new_settings)
                st.session_state.needs_graph_update = True
                save_settings_to_browser()
                st.rerun()
        with col_cancel:
            if st.button("キャンセル", use_container_width=True):
                st.rerun()

    settings_dialog_content()


# ======================================================================================
# 31. 設定更新系サブルーチン (表示切替)
# ======================================================================================
@app.route('/update_display_toggle', methods=['POST'])
def update_display_toggle_handler():
    """
    サイドバーの表示ON/OFFおよび色付風向選択を更新するサブルーチン。
    更新後は refresh=1 を付与してグラフを再生成します。
    """
    import time
    from flask import session, request, redirect, url_for

    # デザイン設定の取得
    user_settings = session.get('design_params', {})

    # 1. グラフ表示ON/OFF項目の更新 (HTMLの並び順に合わせる)
    display_keys = [
        'show_wind', 'show_temp', 'show_wave', 
        'show_ocean_temp', 'show_tide', 'show_w_text'
    ]
    for key in display_keys:
        # チェックボックスは存在すればTrue、なければFalse
        user_settings[key] = True if request.form.get(key) else False

    session['design_params'] = user_settings

    # 2. 色付風向選択の更新 (16方位)
    selected_dirs = request.form.getlist('wind_dirs')
    all_dirs = get_language_dict()['ja']['ALL_DIRECTIONS']
    
    # render_graph_html_flask で使用する bool リストを作成
    sel_dirs_bool = [d in selected_dirs for d in all_dirs]
    session['sel_dirs'] = sel_dirs_bool

    session.modified = True

    # 確実にグラフを更新させるため refresh=1 とタイムスタンプを付与
    return redirect(url_for('index', refresh='1', t=int(time.time())))


# ======================================================================================
# 31_1. 設定更新系サブルーチン (詳細設定)
# ======================================================================================
@app.route('/update_settings', methods=['POST'])
def update_settings_handler():
    """
    詳細設定モーダルのスライダー数値(6項目)を更新するサブルーチン。
    更新後は refresh=1 を付与してグラフを再生成します。
    """
    import time
    from flask import session, request, redirect, url_for

    user_settings = session.get('design_params', {})

    # 更新対象のフィールド定義
    fields = [
        'height_inch', 'top_margin_inch', 'hspace_inch', 
        'width_inch', 'margin_left_inch', 'font_size'
    ]
    
    for f in fields:
        val = request.form.get(f)
        if val is not None:
            # 数値型に変換して保存 (font_sizeのみ整数)
            # top_margin_inch 等でマイナスの値が渡ってきても float(val) で保持可能
            user_settings[f] = int(val) if f == 'font_size' else float(val)

    session['design_params'] = user_settings
    session.modified = True
    
    # 確実にグラフを更新させるため refresh=1 とタイムスタンプを付与
    return redirect(url_for('index', refresh='1', t=int(time.time())))


# ======================================================================================
# 31_2. 設定更新系サブルーチン (リセット)
# ======================================================================================
@app.route('/reset_settings')
def reset_settings_handler():
    """
    すべてのデザイン・表示設定をリセットし、初期状態でグラフを再生成します。
    """
    import time
    from flask import session, redirect, url_for
    
    session.pop('design_params', None)
    session.pop('sel_dirs', None)
    session.pop('danger_v', None)
    
    # リセット後も初期設定で即座にグラフを描画させるため refresh=1 を付与
    return redirect(url_for('index', refresh='1', t=int(time.time())))

# ======================================================================================
# 33. 地図・位置情報連携サブルーチン (検索モード対応・一本化)
# ======================================================================================

@app.route('/set_location')
def set_location_handler():
    """GPSや外部連携から座標を受け取り、地名を特定して保存する"""
    from flask import session, request, redirect, url_for
    lat_raw = request.args.get('lat')
    lon_raw = request.args.get('lon')
    name_raw = request.args.get('name') 

    if lat_raw and lon_raw:
        lat, lon = float(lat_raw), float(lon_raw)
        user_settings = session.get('design_params', {})
        user_settings['lat'], user_settings['lon'] = lat, lon
        session['design_params'] = user_settings
        session['lat'], session['lon'] = lat, lon
        
        if name_raw:
            session['last_basho'] = name_raw
            session['basho'] = name_raw
        else:
            session['last_basho'] = get_address_from_coords(lat, lon)
            session['basho'] = session['last_basho']
            
        if 'clear_weather_cache_files' in globals():
            clear_weather_cache_files()
        session.modified = True
    return redirect(url_for('index'))

# ======================================================================================
# 33_1. 地図・位置情報連携サブルーチン (地図画面遷移・検索モード対応)
# ======================================================================================
@app.route('/map_select')
def map_select_view():
    """
    地点選択用の地図画面を表示する。
    search_mode=1 の場合は、JavaScript側で現在地への自動移動をスキップし、
    既存のテキストボックスへフォーカスを当てる。
    """
    from flask import render_template, session, request
    user_settings = session.get('design_params', {})
    lat = user_settings.get('lat', 35.6812) 
    lon = user_settings.get('lon', 139.7671)
    
    # 検索モードフラグの取得
    search_mode = request.args.get('search_mode', '0')
    
    lang_dict = get_language_dict().get(session.get('lang', 'ja'))
    return render_template('map_select.html', 
                           lat=lat, lon=lon, 
                           lang_dict=lang_dict, 
                           search_mode=search_mode)

# ======================================================================================
# 33_2. 地図・位置情報連携サブルーチン (地点更新・強制再描画フラグ付与版)
# ======================================================================================
@app.route('/update_by_map')
def update_by_map_handler():
    """
    地図確定時に日本の「町名・字名」を優先的に抽出してセッションを更新する。
    決定ボタン押下後は無条件に次回のグラフ描画を強制するフラグを付与する。
    """
    from flask import request, session, redirect, url_for
    import requests

    lat_raw = request.args.get('lat')
    lon_raw = request.args.get('lon')
    
    if lat_raw and lon_raw:
        try:
            lat, lon = float(lat_raw), float(lon_raw)
            
            # 1. 座標情報をセッションに一貫性を持って保存
            user_settings = session.get('design_params', {})
            user_settings['lat'] = lat
            user_settings['lon'] = lon
            session['design_params'] = user_settings
            
            # 重複管理を避けるため、個別キーも更新
            session['lat'] = lat
            session['lon'] = lon
            
            # 2. 地名（住所ラベル）の取得ロジック
            address_label = ""
            try:
                # 日本語の地名を優先取得
                url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18"
                headers = {'User-Agent': 'PinWeatherApp/1.0', 'Accept-Language': 'ja'}
                res = requests.get(url, headers=headers, timeout=5)
                data = res.json()
                addr = data.get('address', {})

                # 日本の住所体系に適した階層順でラベルを決定
                address_label = (
                    addr.get('quarter') or           # 丁目・字
                    addr.get('suburb') or            # 区・町
                    addr.get('neighbourhood') or     # 近隣住区
                    addr.get('city_district') or     # 行政区
                    addr.get('village') or           # 村
                    addr.get('town') or              # 町
                    addr.get('city') or              # 市
                    f"{lat:.4f}, {lon:.4f}"          # 最終手段
                )
            except Exception:
                # APIエラー時は座標を表示
                address_label = f"{lat:.4f}, {lon:.4f}"
            
            # 3. 表示用の地名を更新
            session['last_basho'] = address_label
            session['basho'] = address_label
            
            # 4. 重要：強制再描画フラグをセット
            # これにより index 側のキャッシュ判定をパスして、必ず最新のグラフを描画させる
            session['needs_refresh'] = True
            
            # 5. 外部データキャッシュのクリア（もし存在すれば）
            if 'clear_weather_cache_files' in globals():
                clear_weather_cache_files()
                
            session.modified = True
            
        except (ValueError, TypeError) as e:
            # 座標が不正な値だった場合の安全策
            print(f"Error updating location from map: {e}")
            
    return redirect(url_for('index'))

# ======================================================================================
# 34. 地名検索・地図連携サブルーチン (Search to Map Jump 改良版)
# ======================================================================================
@app.route('/search_address')
def search_address_handler():
    """
    入力された地名を座標に変換し、その座標を初期値として地図画面へ戻る。
    """
    from flask import request, redirect, url_for, session
    import requests

    query = request.args.get('q', '').strip()
    if not query:
        return redirect(url_for('index'))

    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {'q': query, 'format': 'json', 'limit': 1, 'accept-language': 'ja'}
        headers = {'User-Agent': 'PinWeatherApp/1.0'}
        
        res = requests.get(url, params=params, headers=headers, timeout=5)
        data = res.json()

        if data and len(data) > 0:
            lat = float(data[0]['lat'])
            lon = float(data[0]['lon'])
            
            # セッションを更新して、地図画面をその座標で開かせる
            user_settings = session.get('design_params', {})
            user_settings['lat'], user_settings['lon'] = lat, lon
            session['design_params'] = user_settings
            session.modified = True
            
            # 【ポイント】検索結果を表示した地図画面へ遷移
            return redirect(url_for('map_select_view'))
            
    except Exception as e:
        print(f"Search Error: {e}")

    return redirect(url_for('map_select_view'))

# ======================================================================================
# 41. My Spots 追加ハンドラ (API形式: JavaScriptから呼び出し)
# ======================================================================================
@app.route('/add_to_myspots', methods=['POST'])
def add_to_myspots():
    from flask import request, session, jsonify
    
    data = request.get_json()
    name = data.get('name', '無題の地点')
    lat = float(data.get('lat'))
    lon = float(data.get('lon'))
    
    spots = session.get('user_locations', [])
    
    # 1. 重複チェック (座標がほぼ同じなら上書きまたは無視)
    for spot in spots:
        if abs(spot['lat'] - lat) < 0.0001 and abs(spot['lon'] - lon) < 0.0001:
            return jsonify({"status": "exists", "message": "登録済みです"})
            
    # 2. 件数制限 (10件)
    if len(spots) >= 10:
        return jsonify({"status": "error", "message": "10件制限に達しています"})
        
    # 3. 追加
    # Streamlit版に倣い、名称の先頭に 📍 がなければ付与する処理
    display_name = name if name.startswith("📍") else f"📍 {name}"
    
    spots.append({
        "name": display_name,
        "lat": lat,
        "lon": lon
    })
    
    session['user_locations'] = spots
    session.modified = True
    
    return jsonify({"status": "success", "name": display_name})

# ======================================================================================
# 42. My Spots 管理ハンドラ (完全版: 並び替え・編集・削除対応)
# ======================================================================================
@app.route('/edit_spots')
def edit_spots():
    from flask import render_template, session
    # ユーザー登録地点のみを取得（プリセットは除外）
    spots = session.get('user_locations', [])
    return render_template('edit_spots.html', spots=spots)

@app.route('/update_spot_name', methods=['POST'])
def update_spot_name():
    from flask import request, session, redirect, url_for
    idx = int(request.form.get('idx'))
    new_name = request.form.get('new_name')
    spots = session.get('user_locations', [])
    if 0 <= idx < len(spots):
        spots[idx]['name'] = new_name
        session['user_locations'] = spots
        session.modified = True
    return redirect(url_for('edit_spots'))

@app.route('/move_spot/<int:idx>/<direction>')
def move_spot(idx, direction):
    from flask import session, redirect, url_for
    spots = session.get('user_locations', [])
    target = idx - 1 if direction == 'up' else idx + 1
    if 0 <= idx < len(spots) and 0 <= target < len(spots):
        spots[idx], spots[target] = spots[target], spots[idx]
        session['user_locations'] = spots
        session.modified = True
    return redirect(url_for('edit_spots'))

@app.route('/delete_spot/<int:idx>')
def delete_spot(idx):
    from flask import session, redirect, url_for
    spots = session.get('user_locations', [])
    if 0 <= idx < len(spots):
        spots.pop(idx)
        session['user_locations'] = spots
        session.modified = True
    return redirect(url_for('edit_spots'))

# ======================================================================================
# 43. 地点選択ハンドラ (修正版)
# ======================================================================================
@app.route('/select_spot/<int:spot_id>')
def select_spot_handler(spot_id):
    from flask import session, redirect, url_for
    spots = session.get('user_locations', [])
    
    if 0 <= spot_id < len(spots):
        target = spots[spot_id]
        user_settings = session.get('design_params', {})
        user_settings['lat'] = float(target['lat'])
        user_settings['lon'] = float(target['lon'])
        session['design_params'] = user_settings
        session['last_basho'] = target['name']
        
        # --- フラグ管理：地点が変わったので再描画を強制する ---
        session['needs_refresh'] = True 
        
        if 'clear_weather_cache_files' in globals():
            clear_weather_cache_files()
            
        session.modified = True
    return redirect(url_for('index'))

# ======================================================================================
# 90. ブラウザGPS取得スクリプト生成サブルーチン (自動実行を廃止した完全版)
# ======================================================================================
def get_gps_script_js():
    """
    ブラウザのGPS機能を利用するためのJavaScriptコードを返します。
    ※自動実行(onload等)は含まず、関数定義のみを返します。
    """
    return """
    function getCurrentLocation() {
        if (!navigator.geolocation) {
            alert("お使いのブラウザは位置情報に対応していません。");
            return;
        }

        // ボタンの視覚的フィードバック
        let btn = event ? event.currentTarget : null;
        let originalText = "";
        if (btn) {
            originalText = btn.innerText;
            btn.innerText = "📡 取得中...";
            btn.disabled = true;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                // Flask側で現在地として処理させるため name=現在地 を付与
                window.location.href = `/set_location?lat=${lat}&lon=${lon}&name=現在地`;
            },
            (error) => {
                if (btn) {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
                let msg = "";
                switch(error.code) {
                    case error.PERMISSION_DENIED: msg = "位置情報の利用を許可してください。"; break;
                    case error.POSITION_UNAVAILABLE: msg = "位置情報が取得できません。"; break;
                    case error.TIMEOUT: msg = "タイムアウトしました。"; break;
                    default: msg = "位置情報の取得に失敗しました。"; break;
                }
                alert(msg);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }
    """

#======================================================================================
# 91. 地点リスト・マスタ合成サブルーチン
#======================================================================================
def get_location_buttons_html():
    """
    CONFIGから地点リストを取得し、サイドバー用のボタンHTMLを生成します。
    """
    locations = CONFIG.get("LOCATIONS", [
        {"name": "東京", "lat": 35.6812, "lon": 139.7671},
        {"name": "鹿屋", "lat": 31.3783, "lon": 130.8521}
    ])
    
    html = '<div class="location-list" style="padding: 10px 25px;">'
    html += '<p style="color: #666; font-size: 0.8em; margin-bottom: 5px;">地点選択</p>'
    for loc in locations:
        # クリック時に /set_location へ飛ばす
        html += (
            f'<a href="/set_location?lat={loc["lat"]}&lon={loc["lon"]}&name={loc["name"]}" '
            f'style="padding: 8px 0; font-size: 0.95em; color: #ccc; border-bottom: 1px solid #333;">'
            f'📍 {loc["name"]}</a>'
        )
    html += '</div>'
    return html

# #======================================================================================
# # 92. カスタムレイアウトパラメータを計算するサブルーチン (Flask版)
# #======================================================================================
def calculate_custom_layout_params_flask(user_settings):
    """
    表示項目、個別高さ、合計インチ数を計算します。
    引数 user_settings は session.get('design_params') を想定。
    """
    active_ids = []
    # sessionから表示フラグを取得（デフォルトはTrueとする設計例）
    if user_settings.get("show_wind", True): active_ids.append("WIND")
    if user_settings.get("show_temp", True): active_ids.append("TEMP")
    if user_settings.get("show_wave", True): active_ids.append("WAVE")
    if user_settings.get("show_ocean_temp", True): active_ids.append("OCEAN")
    if user_settings.get("show_tide", True): active_ids.append("TIDE")
    
    height_map = CONFIG.get("GRAPH_HEIGHTS", {})
    active_heights = [float(height_map.get(tid, 0.4)) for tid in active_ids]
    
    h_gap = float(user_settings.get("hspace", 0.1)) # indexで調整済みのキーを使用
    bottom_margin = 0.4
    top_margin = float(user_settings.get("top_margin_inch", 0.2))
    
    if len(active_ids) > 0:
        total_h = (sum(active_heights) + (h_gap * (len(active_ids) - 1)) + bottom_margin + top_margin) * 1.1
    else:
        total_h = 1.5

    return active_ids, active_heights, total_h, top_margin

# #======================================================================================
# # 93. ユーザー指定の物理サイズ(inch)でダッシュボードを描画するサブルーチン (Flask版)
# #======================================================================================
def render_physical_dashboard_flask(df, marine_results, lat, lon, design_params):
    """
    Matplotlibを使用してダッシュボードを描画します。
    Streamlit依存を完全に排除。
    """
    import matplotlib.pyplot as plt
    from matplotlib import gridspec
    # st.session_state ではなく design_params(session由来) を使用
    active_items, active_heights, total_h, h_gap_inch = calculate_custom_layout_params_flask(design_params)

    if not active_items:
        return None

    fig = plt.figure(figsize=(design_params.get("width", 15.0), total_h))
    gs = gridspec.GridSpec(len(active_items), 1, height_ratios=active_heights)
    
    avg_h = sum(active_heights) / len(active_heights)
    plt.subplots_adjust(
        hspace=(h_gap_inch / avg_h), 
        left=0.08, right=0.96, top=0.98, bottom=0.05
    )

    # 軸フォーマッタ等の共通設定（これらもFlask対応のサブルーチンであることを想定）
    formatter = get_x_axis_formatter()
    now_jst = get_now_jst()

    for i, tid in enumerate(active_items):
        ax = fig.add_subplot(gs[i])
        is_bottom = (i == len(active_items) - 1)

        # 各チャート描画関数（これらは既存のものを流用可能）
        if tid == "WIND":
            render_wind_bar_chart(ax, df, design_params.get("danger_v", 10.0), 1, design_params)
        elif tid == "TEMP":
            render_temp_line_chart(ax, df)
        elif tid == "WAVE":
            render_wave_height_chart(ax, df, lat, lon, marine_results, lat, lon, is_bottom)
        elif tid == "OCEAN":
            render_ocean_temp_chart(ax, df, lat, lon, marine_results, lat, lon, is_bottom)
        elif tid == "TIDE":
            render_tide_curve_chart(ax, df, lat, lon, marine_results, lat, lon, is_bottom)

        apply_common_axis_settings(ax, df, formatter, now_jst, design_params)

    return fig


#======================================================================================
# 96. グラフ描画エリア・パーツ生成サブルーチン (Flask連携版)
#======================================================================================
def render_graph_html_flask(danger_v, sel_dirs, design_params, now_jst):
    """
    30番の統合エンジン(generate_high_res_graph)を呼び出し、
    HTMLに埋め込める形式に整えて返すサブルーチン。
    """
    from flask import session
    
    # セッションから現在の地点座標を取得（デフォルトは東京）
    lat = session.get('lat', CONFIG.get("DEFAULT_LAT", 35.6812))
    lon = session.get('lon', CONFIG.get("DEFAULT_LON", 139.7671))

    # --- 30番のサブルーチンを呼び出し ---
    # 徹夜で修復されたロジックをそのまま実行します
    res = generate_high_res_graph(
        lat, lon, danger_v, tuple(sel_dirs), design_params, now_jst
    )
    
    # エラーハンドリング
    if not res or res[0] is None:
        return "<div class='alert alert-danger'>グラフの生成に失敗しました。</div>"
        
    left_b64, right_b64, ratio_info, start_idx, df_graph, split_px = res
    
    # デザイン設定の取得
    dpi = design_params.get("graph_dpi", 200)
    # 高さは30番の内部計算結果に合わせるため auto に設定
    
    # 横幅計算（30番の計算結果を利用）
    w_right_px = ratio_info[0]
    
    # アイコンHTML生成（既存のサブルーチンを想定）
    header_h, body_h = generate_weather_icons_html(df_graph, ratio_info, w_right_px, start_idx, design_params)
    
    # HTML構築：Jinja2に渡すための最終的な文字列（構文エラーを修正）
    html_str = (
        f'<div id="graph-wrapper" style="display:flex; width:100%; background:white; border:1px solid #ddd; overflow:hidden;">'
        f'  <div id="graph-left" style="width:{split_px}px; min-width:{split_px}px; flex-shrink:0; overflow:hidden; border-right:1px solid #eee; background:white; z-index:10;">'
        f'    <div style="width:100%;">{header_h}</div>'
        f'    <img src="data:image/png;base64,{left_b64}" style="width:100%; height:auto; display:block;">'
        f'  </div>'
        f'  <div id="graph-right" style="flex-grow:1; overflow-x:auto; background:white;">'
        f'    <div style="width:{w_right_px}px; position:relative;">'
        f'      {body_h}'
        f'      <img src="data:image/png;base64,{right_b64}" style="width:100%; height:auto; display:block;">'
        f'    </div>'
        f'  </div>'
        f'</div>'
    )
    return html_str



# ======================================================================================
# グローバル変数でキャッシュを保持（Cookie制限 4KB 回避用）
# ======================================================================================
render_cache = {}

# ======================================================================================
# 98. Flask メインルート: インデックス表示 (キャッシュ・フラグ制御完全版)
# ======================================================================================
@app.route('/')
def index():
    import pytz, datetime, traceback
    from flask import session, render_template, request

    # --- 1. 初期設定と言語準備 ---
    all_langs = get_language_dict()
    selected_lang = session.get('lang', 'ja')
    lang_dict = all_langs.get(selected_lang, all_langs['ja'])

    # --- 2. 時間設定 ---
    jst = pytz.timezone('Asia/Tokyo')
    now_jst = datetime.datetime.now(jst)
    
    # --- 3. 座標とフラグの取得 ---
    user_settings = session.get('design_params', {})
    
    # GPSや地図選択からの遷移（URLパラメータ）があれば更新し、再描画フラグを立てる
    req_lat = request.args.get('lat')
    req_lon = request.args.get('lon')
    if req_lat and req_lon:
        user_settings['lat'] = float(req_lat)
        user_settings['lon'] = float(req_lon)
        session['design_params'] = user_settings
        session['needs_refresh'] = True
        session.modified = True

    lat = float(user_settings.get('lat', CONFIG.get("DEFAULT_LAT", 35.6812)))
    lon = float(user_settings.get('lon', CONFIG.get("DEFAULT_LON", 139.7671)))

    # --- 4. デザインパラメータの構築 ---
    design_params = {
        "width_inch": float(user_settings.get('width_inch', 15.0)),
        "height_inch": float(user_settings.get('height_inch', 0.6)),
        "top_margin_inch": float(user_settings.get('top_margin_inch', -0.4)),
        "hspace_inch": float(user_settings.get('hspace_inch', 1.0)),
        "margin_left_inch": float(user_settings.get('margin_left_inch', 0.6)),
        "font_size": int(user_settings.get('font_size', 8)),
        "graph_dpi": int(user_settings.get('graph_dpi', 200)),
        "show_wind": user_settings.get('show_wind', True),
        "show_temp": user_settings.get('show_temp', True),
        "show_tide": user_settings.get('show_tide', True),
        "show_wave": user_settings.get('show_wave', True),
        "show_ocean_temp": user_settings.get('show_ocean_temp', True),
        "show_w_text": user_settings.get('show_w_text', False),
        "lat": lat,
        "lon": lon,
        "danger_v": float(session.get('danger_v', 10.0))
    }

    danger_v = design_params["danger_v"]
    sel_dirs = session.get('sel_dirs', [True]*16)

    # --- 5. 描画判定ロジック ---
    cache_key = f"{lat:.4f}_{lon:.4f}_{selected_lang}"
    force_refresh = (request.args.get('refresh') == '1') or session.get('needs_refresh', False)
    
    should_render = False
    if force_refresh:
        should_render = True
    elif cache_key not in render_cache:
        should_render = True
    else:
        # キャッシュ済みの場合、時刻を確認（30分 = 1800秒）
        cached_item = render_cache[cache_key]
        last_draw_time = cached_item.get('timestamp')
        if (now_jst - last_draw_time).total_seconds() > 1800:
            should_render = True

    try:
        # --- 6. グラフ生成またはキャッシュ取得 ---
        if should_render:
            # 30番のエンジンを呼び出し（重い処理）
            graph_html = render_graph_html_flask(danger_v, sel_dirs, design_params, now_jst)
            
            # サーバー側メモリに時刻と共に保存
            render_cache[cache_key] = {
                'html': graph_html,
                'timestamp': now_jst
            }
            # 再描画が完了したのでフラグを下ろす
            session['needs_refresh'] = False
            session.modified = True
        else:
            # キャッシュから高速取得
            graph_html = render_cache[cache_key]['html']

        # --- 7. 付随情報の準備 ---
        display_basho = session.get('last_basho') or session.get('basho') or CONFIG.get("DEFAULT_BASHO", "東京")
        user_spots = session.get('user_locations', [])
        for spot in user_spots:
            if abs(float(spot['lat']) - lat) < 0.0001 and abs(float(spot['lon']) - lon) < 0.0001:
                display_basho = spot['name']
                break

        location_buttons = get_location_buttons_html()
        w_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,windspeed_10m,winddirection_10m,precipitation&timezone=auto"
        m_url = f"https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&hourly=wave_height,sea_surface_temperature,sea_level_height_msl&timezone=auto"

        return render_template(
            'index.html',
            lang_dict=lang_dict,
            now_jst=now_jst,
            graph_html=graph_html,
            location_buttons=location_buttons,
            gps_script=get_gps_script_js(),
            design_params=design_params,
            sel_dirs=sel_dirs,
            danger_v=danger_v,
            w_url=w_url,
            m_url=m_url,
            basho=display_basho,
            error_msg=None,
            app_config={"icon_path": "static/pin_weather_01.png"}
        )

    except Exception:
        return render_template(
            'index.html',
            lang_dict=lang_dict,
            error_msg=traceback.format_exc(),
            design_params=design_params,
            sel_dirs=sel_dirs,
            danger_v=danger_v,
            w_url="",
            m_url="",
            now_jst=now_jst,
            location_buttons="",
            basho="Error"
        )


# ======================================================================================
# 96. グラフ描画エリア生成サブルーチン (座標不整合修正版)
# ======================================================================================
def render_graph_html_flask(danger_v, sel_dirs, design_params, now_jst):
    """
    引数 design_params から座標を確実に取得し、30番の統合エンジンを呼び出します。
    """
    # セッションからではなく、引数(indexで決定した最新座標)から取得
    lat = design_params.get('lat')
    lon = design_params.get('lon')

    # --- 30番のサブルーチンを呼び出し ---
    res = generate_high_res_graph(
        lat, lon, danger_v, tuple(sel_dirs), design_params, now_jst
    )
    
    if not res or res[0] is None:
        return "<div class='alert alert-danger'>グラフの生成に失敗しました。</div>"
        
    left_b64, right_b64, ratio_info, start_idx, df_graph, split_px = res
    w_right_px = ratio_info[0]
    
    header_h, body_h = generate_weather_icons_html(df_graph, ratio_info, w_right_px, start_idx, design_params)
    
    html_str = (
        f'<div id="graph-wrapper" style="display:flex; width:100%; background:white; border:1px solid #ddd; overflow:hidden;">'
        f'  <div id="graph-left" style="width:{split_px}px; min-width:{split_px}px; flex-shrink:0; overflow:hidden; border-right:1px solid #eee; background:white; z-index:10;">'
        f'    <div style="width:100%;">{header_h}</div>'
        f'    <img src="data:image/png;base64,{left_b64}" style="width:100%; height:auto; display:block;">'
        f'  </div>'
        f'  <div id="graph-right" style="flex-grow:1; overflow-x:auto; background:white;">'
        f'    <div style="width:{w_right_px}px; position:relative;">'
        f'      {body_h}'
        f'      <img src="data:image/png;base64,{right_b64}" style="width:100%; height:auto; display:block;">'
        f'    </div>'
        f'  </div>'
        f'</div>'
    )
    return html_str

# ======================================================================================
# 99_1. Flask 設定更新ルーチン (修正版)
# ======================================================================================
@app.route('/update_settings', methods=['POST'])
def update_settings():
    from flask import session, request, redirect, url_for
    user_settings = session.get('design_params', {})
    try:
        fields = ["width_inch", "hspace_inch", "margin_left_inch", "top_margin_inch", "font_size", "graph_dpi"]
        for field in fields:
            val = request.form.get(field)
            if val is not None:
                user_settings[field] = float(val) if '.' in str(val) else int(val)
        
        session['design_params'] = user_settings
        
        # --- フラグ管理：設定が変わったので再描画を強制する ---
        session['needs_refresh'] = True 
        
        session.modified = True
    except Exception as e:
        print(f"Update Settings Error: {e}")
    return redirect(url_for('index'))

#======================================================================================
# 99_2. Flask 設定リセットルーチン
#======================================================================================
@app.route('/reset_settings')
def reset_settings():
    from flask import session, redirect, url_for
    try:
        # セッションの設定を破棄して初期状態に戻す
        if 'design_params' in session:
            session.pop('design_params')
        session.modified = True
        
        # もしキャッシュクリア用のサブルーチンがあれば実行
        if 'clear_weather_cache_files' in globals():
            clear_weather_cache_files()
            
        return redirect(url_for('index'))
    except Exception as e:
        import traceback
        raise RuntimeError(traceback.format_exc())

# ======================================================================================
# 80. 言語切り替えエンドポイント (確実な登録版)
# ======================================================================================
@app.route('/change_lang')
def change_lang():
    from flask import session, redirect, request, url_for
    current_lang = session.get('lang', 'ja')
    session['lang'] = 'en' if current_lang == 'ja' else 'ja'
    session.modified = True
    return redirect(request.referrer or url_for('index'))
    
# ======================================================================================
# 44. LocalStorage からのセッション復元ハンドラ
# ======================================================================================
@app.route('/restore_settings', methods=['POST'])
def restore_settings():
    from flask import request, session, jsonify
    try:
        data = request.get_json()
        if not data: return jsonify({"status": "error"}), 400

        # バックアップからサーバーのセッションへ一括書き戻し
        session['user_locations'] = data.get('user_locations', [])
        session['design_params'] = data.get('design_params', {})
        session['last_basho'] = data.get('last_basho', '')
        session['sel_dirs'] = data.get('sel_dirs', [])
        session['lang'] = data.get('lang', 'ja')
        
        session.modified = True
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ======================================================================================
# 100. アプリケーション起動サブルーチン (Render標準ポート同期版)
# ======================================================================================
if __name__ == "__main__":
    import os
    # Renderの環境変数PORTを最優先で取得
    port = int(os.environ.get("PORT", 10000))
    
    # host="0.0.0.0" は 502 Bad Gateway 回避のために必須
    # debug=False はデプロイ時のタイムアウトを防ぐために必須
    app.run(host="0.0.0.0", port=port, debug=False)





