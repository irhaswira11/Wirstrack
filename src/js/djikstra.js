// Fungsi untuk menghitung jarak antara dua titik koordinat menggunakan Haversine formula
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

// Fungsi untuk mengonversi sudut dalam derajat ke radian
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

// Kelas untuk merepresentasikan graf
class Graph {
  constructor() {
    this.vertices = [];
    this.edges = {};
  }

  // Menambahkan vertex ke dalam graf
  addVertex(vertex) {
    this.vertices.push(vertex);
    this.edges[vertex] = {};
  }

  // Menambahkan edge (jarak) antara dua vertex
  addEdge(vertex1, vertex2, distance) {
    this.edges[vertex1][vertex2] = distance;
    this.edges[vertex2][vertex1] = distance;
  }

  // Mendapatkan jarak terpendek dari startVertex ke semua vertex lainnya
  dijkstra(startVertex) {
    const distances = {};
    const visited = {};
    const previous = {};
    const queue = new PriorityQueue();

    // Inisialisasi jarak awal dari startVertex ke semua vertex lainnya sebagai Infinity
    // dan startVertex sendiri sebagai 0
    this.vertices.forEach((vertex) => {
      distances[vertex] = Infinity;
      previous[vertex] = null;
    });
    distances[startVertex] = 0;

    // Masukkan startVertex ke dalam antrian dengan jarak 0
    queue.enqueue(startVertex, 0);

    while (!queue.isEmpty()) {
      const currentVertex = queue.dequeue().data;
      visited[currentVertex] = true;

      // Jika currentVertex sudah dikunjungi, lanjutkan ke vertex berikutnya
      if (!visited[currentVertex]) {
        continue;
      }

      // Untuk setiap vertex tetangga dari currentVertex
      for (let neighbor in this.edges[currentVertex]) {
        const distance = this.edges[currentVertex][neighbor];
        const totalDistance = distances[currentVertex] + distance;

        // Jika jarak total lebih kecil dari jarak saat ini, update jarak dan vertex sebelumnya
        if (totalDistance < distances[neighbor]) {
          distances[neighbor] = totalDistance;
          previous[neighbor] = currentVertex;
        }

        // Masukkan tetangga ke dalam antrian dengan jarak terkini
        if (!visited[neighbor]) {
          queue.enqueue(neighbor, distances[neighbor]);
        }
      }
    }

    return { distances, previous };
  }

  // Mendapatkan jalur terpendek dari startVertex ke endVertex berdasarkan vertex sebelumnya
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

// Kelas untuk merepresentasikan antrian prioritas
class PriorityQueue {
  constructor() {
    this.items = [];
  }

  // Menambahkan elemen ke dalam antrian dengan prioritas tertentu
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

  // Menghapus dan mengembalikan elemen dengan prioritas tertinggi
  dequeue() {
    if (this.isEmpty()) {
      return null;
    }

    return this.items.shift();
  }

  // Memeriksa apakah antrian kosong
  isEmpty() {
    return this.items.length === 0;
  }
}

// Contoh penggunaan

// Inisialisasi graf
const graph = new Graph();

// Tambahkan vertex (kota) ke dalam graf
graph.addVertex("A");
graph.addVertex("B");
graph.addVertex("C");
graph.addVertex("D");

// Tambahkan edge (jarak) antara vertex (kota)
graph.addEdge("A", "B", calculateDistance(10, 20, 10, 30)); // Contoh jarak antara A dan B
graph.addEdge("A", "C", calculateDistance(10, 20, 15, 25)); // Contoh jarak antara A dan C
graph.addEdge("B", "D", calculateDistance(10, 30, 20, 40)); // Contoh jarak antara B dan D
graph.addEdge("C", "D", calculateDistance(15, 25, 20, 40)); // Contoh jarak antara C dan D

// Cari jarak terdekat dari vertex "A" ke semua vertex lainnya
const { distances, previous } = graph.dijkstra("A");

// Cetak jarak terdekat dari vertex "A" ke semua vertex lainnya
console.log("Jarak terdekat dari A ke:");
for (let vertex in distances) {
  console.log(vertex, "-", distances[vertex]);
}

// Cetak jalur terpendek dari vertex "A" ke vertex "E"
const shortestPath = graph.getShortestPath(previous, "D");
console.log("Jalur terpendek dari A ke E:", shortestPath.join(" -> "));
