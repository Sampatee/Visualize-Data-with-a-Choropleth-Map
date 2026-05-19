import "./style.css";
import * as d3 from "d3";
import * as topojson from "topojson";

const mapURL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
const eduURL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

const initRender = () => {
  d3.select("#app").html(
    `<h1 id="title">United States Educational Attainment</h1>
    <p id="description">Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)</p>
    <svg id="chart"></svg>
    <p id="source">Source: <a href="https://www.ers.usda.gov/data-products/county-level-data-sets/download-data.aspx">USDA Economic Research Service</a></p>
    <div id="tooltip"></div>`,
  );
};

const renderChart = async () => {
  try {
    //set chart dimensions
    const width = 960;
    const height = 600;

    const chart = d3
      .select("#chart")
      .attr("width", width)
      .attr("height", height);
    const tooltip = d3.select("#tooltip");

    //initialize tooltip
    tooltip.style("opacity", 0);

    //define path function
    const path = d3.geoPath();

    //define data
    const mapData = await d3.json(mapURL); //topoJSON
    const eduData = await d3.json(eduURL);

    //map county id to county eduData
    const eduMap = new Map(eduData.map((c) => [c.fips, c]));

    //convert topoJSON counties to geoJSON counties
    const counties = topojson.feature(mapData, mapData.objects.counties);

    //get inter-state-boundaries
    const stateBoundary = topojson.mesh(
      mapData,
      mapData.objects.states,
      (a, b) => a !== b,
    ); //last argument means "only get the boundary if state a and b are different"

    const minPercent = d3.min(eduData, (d) => d.bachelorsOrHigher);
    const maxPercent = d3.max(eduData, (d) => d.bachelorsOrHigher);

    //define color scale
    const colorScale = d3
      .scaleThreshold()
      .domain(d3.range(minPercent, maxPercent, (maxPercent - minPercent) / 8))
      .range(d3.schemeGreens[9]);

    //set data
    chart
      .append("g")
      .selectAll(".county")
      .data(counties.features)
      .join("path")
      .attr("class", "county")
      .attr("data-fips", (d) => d.id)
      .attr("data-education", (d) => eduMap.get(d.id).bachelorsOrHigher)
      .attr("d", (d) => path(d))
      .style("fill", (d) => colorScale(eduMap.get(d.id).bachelorsOrHigher))
      .on("mouseover", function (e) {
        const hoveredItem = d3.select(this);
        const d = hoveredItem.datum();
        const { area_name, state, bachelorsOrHigher } = eduMap.get(d.id);

        tooltip
          .attr("data-education", bachelorsOrHigher)
          .style("left", e.pageX + 10 + "px")
          .style("top", e.pageY - 30 + "px")
          .style("opacity", 0.9)
          .html(`${area_name}, ${state}: ${bachelorsOrHigher}%`);
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });

    //set inter-state boundary
    chart
      .append("g")
      .append("path")
      .datum(stateBoundary)
      .attr("d", (d) => path(d))
      .style("fill", "none")
      .style("stroke", "white");

    //create legend
    const legend = chart
      .append("g")
      .attr("id", "legend")
      .attr("transform", `translate(${width / 1.625}, 42)`);

    const colorDomain = colorScale.domain();

    const xScaleLegend = d3
      .scaleLinear()
      .domain(d3.extent(colorDomain))
      .range([0, width / 4]);

    const xAxisLegend = d3
      .axisBottom()
      .scale(xScaleLegend)
      .tickValues(colorDomain)
      .tickFormat(d3.format(".0f"))
      .tickSize(12);

    const legendData = colorDomain.slice(0, colorDomain.length - 1);
    const legendRectWidth = xScaleLegend.range()[1] / legendData.length;

    legend
      .append("g")
      .selectAll("rect")
      .data(legendData)
      .join("rect")
      .attr("width", legendRectWidth)
      .attr("height", 6)
      .attr("x", (d) => xScaleLegend(d))
      .attr("y", 0)
      .style("fill", (d) => colorScale(d));

    legend.append("g").call(xAxisLegend).select(".domain").remove();
  } catch (err) {
    console.log(err);
  }
};

d3.select(document).on("DOMContentLoaded", function () {
  initRender();
  renderChart();
});
