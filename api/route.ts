function fetchWithTimeout(url: string, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const signal = controller.signal;

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  return fetch(url, { ...options, signal })
    .then((response) => {
      clearTimeout(timeoutId); // 성공 시 타이머 해제
      return response;
    })
    .catch((error) => {
      if (error.name === "AbortError") {
        throw new Error("Request timed out");
      }
      throw error;
    });
}

export async function getAreaJsonData() {
  return await fetchWithTimeout("../json/area.json", {}).then((data) => {
    return data.json();
  });
}

export async function getAreaCd(x?: Number, y?: Number) {
  const url = `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${y}&y=${x}&input_coord=WGS84`;

  const res = await fetchWithTimeout(url, {
    method: "GET",
    headers: {
      Authorization: `${process.env.NEXT_PUBLIC_KAKAO_REST_HEADER}`,
    },
  });
  return await getAreaJsonData().then((obj) => {
    var regions = obj.region;
    var areas = obj.area;
    return res.json().then((data) => {
      var regionNm = data.documents[0].region_1depth_name
        .replace("특별자치시", "")
        .replace("광역시", "")
        .replace("광역시", "")
        .replace("특별시", "")
        .replace("충청북도", "충북")
        .replace("충청남도", "충남")
        .replace("전라북도", "전북")
        .replace("전라남도", "전남")
        .replace("경상북도", "경북")
        .replace("경상남도", "경남");

      var regionInfo = regions.filter((item: any) => {
        return item.AREA_NM === regionNm;
      })[0];
      var areaNm = data.documents[0].region_2depth_name;
      var areaInfo;
      if (areaNm === "") {
        // 상세 주소의 중앙 값이 없을 경우
        areaInfo = areas.filter((item: any) => {
          return item.AREA_CD.substring(0, 2) === regionInfo.AREA_CD;
        })[0].AREA_CD;
      } else {
        areaNm = areaNm.split(" ")[0];
        areaInfo = areas.filter((item: any) => {
          return item.AREA_CD.substring(0, 2) === regionInfo.AREA_CD && item.AREA_NM === areaNm;
        })[0].AREA_CD;
      }

      return areaInfo;
    });
  });
}

export async function getOilInfo(areaCd: string, oilType: string) {
  var url = `${process.env.NEXT_PUBLIC_OIL_PROXY_SERVER}/getTop20?area=${areaCd}&oilType=${oilType}`;

  return await fetchWithTimeout(url, {
    method: "GET",
  }).then((res) => {
    return res.json().then((data) => {
      return data.RESULT.OIL.map((item: any) => {
        return {
          name: item.OS_NM,
          gisX: item.GIS_X_COOR,
          gisY: item.GIS_Y_COOR,
          price: item.PRICE,
        };
      });
    });
  });
}

export async function transCoord(x?: number, y?: number) {
  var url = `https://dapi.kakao.com/v2/local/geo/transcoord.json?x=${x}&y=${y}&output_coord=WTM`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `${process.env.NEXT_PUBLIC_KAKAO_REST_HEADER}`,
    },
  });
  return res.json().then((data) => {
    return {
      transX: data.documents[0]["x"],
      transY: data.documents[0]["y"],
    };
  });
}
