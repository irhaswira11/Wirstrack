const getGeocode = async (alamat) => {
  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${alamat}&apiKey=dbd4860b7fb8446dac43f068bb57f493`,
      requestOptions
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

const getGeolocationData = async (
  alamatTujuan1,
  alamatTujuan2,
  alamatTujuan3,
  alamatAsal
) => {
  const geolocationData = {};

  const tujuan1 = await getGeocode(alamatTujuan1);
  const tujuan2 = await getGeocode(alamatTujuan2);
  const tujuan3 = await getGeocode(alamatTujuan3);
  const asal = await getGeocode(alamatAsal);

  if (tujuan1) {
    geolocationData.tujuan1 = tujuan1;
  }
  if (tujuan2) {
    geolocationData.tujuan2 = tujuan2;
  }
  if (tujuan3) {
    geolocationData.tujuan3 = tujuan3;
  }
  if (asal) {
    geolocationData.asal = asal;
  }

  return geolocationData;
};
