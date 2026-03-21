from flask import Flask, render_template

# アプリケーションの初期化
app = Flask(__name__)

# ======================================================================================
# 001. メイン画面ルーティング
# ======================================================================================
@app.route('/healthz')
def health_check():
    return "OK", 200

# ======================================================================================
# 090. メイン画面ルーティング
# ======================================================================================
@app.route('/')
def index():
    """
    計算処理はすべてJavaScript(ブラウザ)側で行うため、
    サーバーは index.html を送信する役割に徹します。
    """
    return render_template('index.html')

# ======================================================================================
# 100. アプリケーション起動サブルーチン (環境自動判別・全方位アクセス許可版)
# ======================================================================================
if __name__ == "__main__":
    import os
    import socket

    # Render環境(PORTあり)ならその値を、ローカルなら 5000 を使用
    port_env = os.environ.get("PORT")
    
    if port_env:
        # Render本番環境
        port = int(port_env)
        target_host = "0.0.0.0"
        is_debug = False
    else:
        # ローカル開発環境 (PCで開きやすい5000番に固定)
        port = 5000 
        is_debug = True
        
        # 0.0.0.0 に設定することで、localhost と 物理IP(Wi-Fi経由) の両方から接続可能にする
        target_host = "0.0.0.0"
        
        # ログ表示用に現在の物理IPアドレスを取得
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            display_ip = s.getsockname()[0]
            s.close()
        except Exception:
            display_ip = "127.0.0.1"

    # コンソールへの案内表示
    if not port_env:
        print(f"\n--- Local Test Server Started ---")
        print(f"[PCからのアクセス]     http://localhost:{port}")
        print(f"[スマホからのアクセス]  http://{display_ip}:{port}\n")
    else:
        print(f"\n[Render Production Mode] Port: {port}\n")
    
    # アプリケーションの起動
    app.run(host=target_host, port=port, debug=is_debug)