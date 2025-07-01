// Simple semantic keyword prediction
function predictKeywords(abstract) {
  const keywordBank = {
    bamboo: ["bamboo", "infrastructure", "sustainable", "irrigation"],
    ai: ["AI", "machine learning", "satellite", "monitoring"],
    citizen: ["citizen", "mobile", "mapping", "biodiversity", "crowdsourced"]
  };

  const lower = abstract.toLowerCase();
  const predicted = [];

  Object.entries(keywordBank).forEach(([topic, keywords]) => {
    if (lower.includes(topic)) {
      predicted.push(...keywords);
    }
  });

  return [...new Set(predicted.map(k => k.trim()))];
}

// Map to store abstract details for modal
const abstractMap = new Map();

// Load data and render map
fetch('data.json')
  .then(res => res.json())
  .then(data => {
    const nodes = [];
    const links = [];

    data.forEach((item, index) => {
      const abstractId = `abstract-${index}`;
      nodes.push({ id: abstractId, label: item.abstract, group: 'abstract' });

      const predictedKeywords = predictKeywords(item.abstract);
      abstractMap.set(abstractId, {
        abstract: item.abstract,
        keywords: predictedKeywords
      });

      predictedKeywords.forEach((kw, i) => {
        const kwId = `${abstractId}-kw-${i}`;
        nodes.push({ id: kwId, label: kw, group: 'keyword' });
        links.push({ source: abstractId, target: kwId });
      });
    });

    drawMindMap(nodes, links);
  });

// Draw the graph
function drawMindMap(nodes, links) {
  const width = document.getElementById('mindmap').clientWidth;
  const height = 600;

  const svg = d3.select('#mindmap')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const tooltip = d3.select("body").append("div").attr("class", "tooltip");

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(40))
    .force("charge", d3.forceManyBody().strength(-80))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("collide", d3.forceCollide().radius(d => d.group === 'abstract' ? 22 : 14));

  const link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "link")
    .attr("stroke-width", 1.5);

  const node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "node")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  node.append("circle")
    .attr("r", d => d.group === 'abstract' ? 12 : 8)
    .attr("fill", d => d.group === 'abstract' ? "#1f77b4" : "#ff7f0e")
    .on("click", (event, d) => {
      if (d.group === 'abstract') {
        const data = abstractMap.get(d.id);
        showModal(data.abstract, data.keywords);
      }
    })
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(d.label)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  node.append("text")
    .attr("dx", 12)
    .attr("dy", "0.35em")
    .text(d => d.group === 'keyword' ? d.label : '');

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("transform", d => `translate(${d.x},${d.y})`);
  });

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

// Show modal with Bootstrap
function showModal(abstract, keywords) {
  document.getElementById("modal-abstract").textContent = abstract;

  const keywordList = document.getElementById("modal-keywords");
  keywordList.innerHTML = '';
  keywords.forEach(k => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = k;
    keywordList.appendChild(li);
  });

  const modal = new bootstrap.Modal(document.getElementById('abstractModal'));
  modal.show();
}
