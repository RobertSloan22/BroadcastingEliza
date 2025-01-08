from flask import Flask, render_template, request, jsonify
from crawl import main, generate_file, build_qa_chain, build_vector_store, crawl_docs, scan_codebase

app = Flask(__name__)

# Global variables to store the vector store and QA chain
vector_store = None
qa_chain = None

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/init", methods=["POST"])
def init():
    global vector_store, qa_chain
    codebase = scan_codebase(".")
    docs_data = crawl_docs("https://elizaos.github.io/eliza/docs/intro/", max_pages=100)
    vector_store = build_vector_store(docs_data, codebase)
    qa_chain = build_qa_chain(vector_store)
    return jsonify({"status": "success"})

@app.route("/ask", methods=["POST"])
def ask():
    question = request.json["question"]
    result = qa_chain.invoke({"query": question})
    return jsonify({"answer": result["result"], "sources": [doc.metadata for doc in result["source_documents"]]})

@app.route("/generate", methods=["POST"])
def generate():
    filepath = request.json["filepath"]
    description = request.json["description"]
    content = generate_file(qa_chain, filepath, description)
    return jsonify({"content": content})

if __name__ == "__main__":
    app.run(debug=True)