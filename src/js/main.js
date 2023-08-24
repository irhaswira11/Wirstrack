const submitButton = document.getElementById("submit");

const getGeocode = async (alamat) => {
  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${alamat}&apiKey=dbd4860b7fb8446dac43f068bb57f493`
    );
    const data = await response.json();
    if (data && data.features && data.features.length > 0) {
      const location = data.features[0].properties;
      const latitude = location.lat;
      const longitude = location.lon;
      return { latitude, longitude };
    } else {
      console.log("Tidak ada data geolokasi ditemukan.");
      return null;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getGeolocationData = async (...alamatTujuanArray) => {
  const geolocationData = {};

  for (const alamat of alamatTujuanArray) {
    const geocode = await getGeocode(alamat);
    if (geocode) {
      geolocationData[alamat] = geocode;
    }
  }

  return geolocationData;
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Jarak dalam kilometer
  return distance;
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

class Graph {
  constructor() {
    this.vertices = [];
    this.edges = {};
  }

  addVertex(vertex) {
    this.vertices.push(vertex);
    this.edges[vertex] = {};
  }

  addEdge(vertex1, vertex2, distance) {
    this.edges[vertex1][vertex2] = distance;
    this.edges[vertex2][vertex1] = distance;
  }

  dijkstra(startVertex) {
    const distances = {};
    const visited = {};
    const previous = {};
    const queue = new PriorityQueue();

    this.vertices.forEach((vertex) => {
      distances[vertex] = Infinity;
      previous[vertex] = null;
    });
    distances[startVertex] = 0;

    queue.enqueue(startVertex, 0);

    while (!queue.isEmpty()) {
      const currentVertex = queue.dequeue().data;
      visited[currentVertex] = true;

      if (!visited[currentVertex]) {
        continue;
      }

      for (let neighbor in this.edges[currentVertex]) {
        const distance = this.edges[currentVertex][neighbor];
        const totalDistance = distances[currentVertex] + distance;

        if (totalDistance < distances[neighbor]) {
          distances[neighbor] = totalDistance;
          previous[neighbor] = currentVertex;
        }

        if (!visited[neighbor]) {
          queue.enqueue(neighbor, distances[neighbor]);
        }
      }
    }

    return { distances, previous };
  }

  getShortestPath(previous, endVertex) {
    const path = [];
    let currentVertex = endVertex;

    while (currentVertex !== null) {
      path.unshift(currentVertex);
      currentVertex = previous[currentVertex];
    }

    return path;
  }
}

class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(data, priority) {
    const element = { data, priority };

    if (this.isEmpty()) {
      this.items.push(element);
    } else {
      let added = false;

      for (let i = 0; i < this.items.length; i++) {
        if (element.priority < this.items[i].priority) {
          this.items.splice(i, 0, element);
          added = true;
          break;
        }
      }

      if (!added) {
        this.items.push(element);
      }
    }
  }

  dequeue() {
    if (this.isEmpty()) {
      return null;
    }

    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

const map = L.map("map").setView([-6.2, 106.816666], 9);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const showOnMap = async (alamatAsal, ruteArray) => {
  const titikAsalPromise = getGeocode(alamatAsal);
  const rutePromises = ruteArray.map((rute) => getGeocode(rute));

  const [titikAsal, ...ruteResults] = await Promise.all([
    titikAsalPromise,
    ...rutePromises,
  ]);

  const waypoints = [
    L.latLng(titikAsal.latitude, titikAsal.longitude),
    ...ruteResults.map((ruteResult) =>
      L.latLng(ruteResult.latitude, ruteResult.longitude)
    ),
  ];

  L.Routing.control({
    waypoints: waypoints,
  }).addTo(map);
};

async function calculateShortestRoute(
  geolocationData,
  alamatAsal,
  alamatTujuan1,
  alamatTujuan2,
  alamatTujuan3
) {
  if (!geolocationData.hasOwnProperty(alamatAsal)) {
    console.log(`Data geolokasi untuk alamat ${alamatAsal} tidak ditemukan.`);
    return;
  }

  const graph = new Graph();

  graph.addVertex(alamatAsal);

  const tujuanArray = [alamatTujuan1, alamatTujuan2, alamatTujuan3];

  tujuanArray.forEach((tujuan) => {
    if (geolocationData.hasOwnProperty(tujuan)) {
      graph.addVertex(tujuan);
    }
  });

  tujuanArray.forEach((tujuan, index) => {
    graph.addEdge(
      alamatAsal,
      tujuan,
      calculateDistance(
        geolocationData[alamatAsal].latitude,
        geolocationData[alamatAsal].longitude,
        geolocationData[tujuan].latitude,
        geolocationData[tujuan].longitude
      )
    );
  });

  const startVertex = alamatAsal;
  const { distances, previous } = graph.dijkstra(startVertex);

  tujuanArray.sort((a, b) => {
    const distanceA = distances[a] || Infinity;
    const distanceB = distances[b] || Infinity;
    return distanceA - distanceB;
  });

  const formattedData = {
    alamatAsal: alamatAsal,
    tujuanArray: tujuanArray.map((tujuan) => ({
      alamat: tujuan,
      jarak: distances[tujuan].toFixed(2) + " km",
    })),
  };

  tujuanArray.forEach((tujuan, index) => {
    const shortestPath = graph.getShortestPath(previous, tujuan);
    const distance = distances[tujuan] || Infinity;
    console.log(`Rute terdekat ke ${tujuan}: ${shortestPath}`);
    console.log(`Jarak terdekat ke ${tujuan}: ${distance.toFixed(2)} km`);
  });

  await showOnMap(alamatAsal, tujuanArray);
  return formattedData;
}

submitButton.addEventListener("click", async function (event) {
  event.preventDefault();

  const alamatTujuan1 = document.querySelector(
    'input[name="alamat_tujuan1"]'
  ).value;
  const alamatTujuan2 = document.querySelector(
    'input[name="alamat_tujuan2"]'
  ).value;
  const alamatTujuan3 = document.querySelector(
    'input[name="alamat_tujuan3"]'
  ).value;
  const alamatAsal = document.querySelector('input[name="alamat_asal"]').value;

  if (!alamatTujuan1 || !alamatTujuan2 || !alamatTujuan3 || !alamatAsal) {
    alert("Semua input harus diisi sebelum melakukan pencarian rute.");
    return;
  }

  const geolocationData = await getGeolocationData(
    alamatTujuan1,
    alamatTujuan2,
    alamatTujuan3,
    alamatAsal
  );

  console.log(geolocationData);

  if (geolocationData) {
    const shortestRoutes = await calculateShortestRoute(
      geolocationData,
      alamatAsal,
      alamatTujuan1,
      alamatTujuan2,
      alamatTujuan3
    );

    console.log(shortestRoutes);

    // // Simpan hasil rute ke sessionStorage
    sessionStorage.setItem("shortestRoutes", JSON.stringify(shortestRoutes));

    // console.log(formattedData);
    // Arahkan pengguna ke halaman "result.html"
    window.location.href = "detail.html";
  }
});

(function () {
  $("form > input").keyup(function () {
    var empty = false;
    $("form > input").each(function () {
      if ($(this).val() == "") {
        empty = true;
      }
    });

    if (empty) {
      $("#submit").attr("disabled", "disabled");
      $("input[type=submit").css("background-color", "#D5D9EB");
    } else {
      $("#submit").removeAttr("disabled");
      $("input[type=submit").css("background-color", "#175CD3");
    }
  });
})();
