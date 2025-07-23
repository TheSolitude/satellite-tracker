from flask import Flask, render_template, jsonify
import requests

app = Flask(__name__)

ISS_API_URL = "http://api.open-notify.org/iss-now.json"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/iss_location")
def iss_location():
    try:
        response = requests.get(ISS_API_URL, timeout=5)
        response.raise_for_status()
        data = response.json()
        latitude = float(data["iss_position"]["latitude"])
        longitude = float(data["iss_position"]["longitude"])
        return jsonify({"latitude": latitude, "longitude": longitude})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
