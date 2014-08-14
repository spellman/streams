require "nokogiri"

input_html_filename = "streams.html"
doc = Nokogiri::HTML(open(input_html_filename))

output_js_filename = "streams.js"
prefix = "\"use strict\";"
suffix = ""
block_separator = "\n\n"

js_nodes = doc.css(".code-listing pre")

js_from_html_file = js_nodes.reduce { |acc_string, node|
  [acc_string, node.text].join(block_separator)
}

js = [prefix, js_from_html_file, suffix].join(block_separator)

IO.write(output_js_filename, js)
