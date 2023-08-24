// Di halaman "detail.html"

// Ambil elemen-elemen HTML yang diperlukan
const asalElement = document.getElementById("asal");
const descContainer = document.querySelector(".desc");

// Ambil hasil rute dari sessionStorage
const shortestRoutesString = sessionStorage.getItem("shortestRoutes");
const shortestRoutes = JSON.parse(shortestRoutesString);

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

const map = L.map("map").setView([-6.2, 106.816666], 9);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const showOnMap = async (alamatAsal, tujuanArray) => {
  const titikAsalPromise = getGeocode(alamatAsal);
  const rutePromises = tujuanArray.map((tujuan) => getGeocode(tujuan.alamat));

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

// Tampilkan hasil rute
if (shortestRoutes) {
  const asal = shortestRoutes.alamatAsal;
  const tujuanArray = shortestRoutes.tujuanArray;

  // Render alamat asal
  asalElement.textContent = asal;

  // Render setiap tujuan dan jaraknya
  tujuanArray.forEach((tujuan, index) => {
    const rute = index === 0 ? "tujuan terdekat" : `tujuan ke-${index + 1}`;
    const alamat = tujuan.alamat;
    const jarak = tujuan.jarak;

    // Buat elemen-elemen HTML untuk tujuan dan jaraknya
    const descItem = document.createElement("div");
    descItem.classList.add("desc-item");

    const heading = document.createElement("h3");
    heading.textContent = rute;

    const title = document.createElement("p");
    title.classList.add("title");
    title.textContent = alamat;

    const subtitle = document.createElement("p");
    subtitle.classList.add("subtitle");
    subtitle.textContent = jarak;

    // Tambahkan elemen-elemen ke dalam container
    descItem.appendChild(heading);
    descItem.appendChild(title);
    descItem.appendChild(subtitle);
    descContainer.appendChild(descItem);

    // Tambahkan garis pemisah
    if (index < tujuanArray.length - 1) {
      const line = document.createElement("div");
      line.classList.add("line");
      descContainer.appendChild(line);
    }

    showOnMap(asal, tujuanArray);
  });
} else {
  console.log("Tidak ada hasil rute yang tersedia.");
}

// Bersihkan data rute dari sessionStorage
// sessionStorage.removeItem("shortestRoutes");
