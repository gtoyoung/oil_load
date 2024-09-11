"use client";

import { LegacyRef, useEffect, useRef, useState } from "react";
import { getAreaCd, getOilInfo, transCoord } from "../../api/route";
import proj4 from "proj4";
import confetti from "canvas-confetti";

type MapAttr = {
  lat: number;
  long: number;
};

type OilInfo = {
  name: string;
  gisX: number;
  gisY: number;
  price: number;
};

type ViewInfo = {
  name: string;
  price: number;
  distance: string;
  totalCost: number;
};

proj4.defs(
  "EPSG:5178",
  "+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43"
);

const fromProj = "EPSG:5178";
const toProj = "EPSG:4326";

export default function Home() {
  const modalRef: LegacyRef<HTMLDialogElement> = useRef(null);
  const [process, setProcess] = useState<string>("정보");
  const [oilType, setOilType] = useState<string>("D047");
  const [currentLocation, setCurrentLocation] = useState<MapAttr>();
  const [viewInfos, setViewInfos] = useState<ViewInfo[]>();

  const search = async () => {
    let viewInfoList: ViewInfo[] = [];
    setProcess("areaCd 가져오기");
    let areaCd = await getAreaCd(currentLocation?.lat, currentLocation?.long);
    setProcess("areaCd 가져옴");
    setProcess("주소변환하기");
    let transFrom = await transCoord(
      currentLocation?.lat,
      currentLocation?.long
    );
    setProcess("주소변환완료");
    let transFromX = transFrom.transX;
    let transFromY = transFrom.transY;
    setProcess("주유소 정보 가져오기");
    let oilInfoList = await getOilInfo(areaCd, oilType);
    setProcess("주유소 정보 가져오기 완료");
    setProcess("거리 정보 및 데이터 조작중");
    for (let i = 0; i < oilInfoList.length; i++) {
      let item: OilInfo = oilInfoList[i];
      let name = item.name;
      let price = item.price;
      let x = item.gisX;
      let y = item.gisY;
      const [lon, lat] = proj4(fromProj, toProj, [x, y]);
      let transTo = await transCoord(lat, lon);
      let transToX = transTo.transX;
      let transToY = transTo.transY;
      const distance = Math.sqrt(
        (transToX - transFromX) ** 2 + (transToY - transFromY) ** 2
      );
      const info: ViewInfo = {
        name: name,
        price: price,
        distance: (distance / 1000).toFixed(2) + "KM",
        totalCost: totalCost(distance, 10, price),
      };
      viewInfoList.push(info);
    }
    setProcess("거리 정보 및 데이터 조작완료");
    viewInfoList.sort((a, b) => {
      return a.totalCost - b.totalCost;
    });
    setViewInfos(viewInfoList);
  };

  const totalCost = (distance: number, efficiency: number, price: number) => {
    let totalCost = (distance / efficiency) * price;
    return totalCost;
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let x = position.coords.latitude;
        let y = position.coords.longitude;
        setCurrentLocation({
          lat: position.coords.latitude,
          long: position.coords.longitude,
        });
      },
      (event) => {
        alert(
          `위치 정보를 가져오는데 문제가 발생했습니다. ${event.code} - ${event.message}`
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 60000,
        maximumAge: 0,
      }
    );
  }, []);

  const ModalPop = () => {
    return (
      <dialog ref={modalRef}>
        {/* <h2>test</h2> */}
        <ul className="tilesWrap">
          {viewInfos?.length === 0
            ? "로딩중입니당."
            : viewInfos?.map((item, index) => {
                return (
                  <li key={index}>
                    <h2>Rank.{index + 1}</h2>
                    <h3>{item.name}</h3>
                    <p>
                      <span>가격: {item.price}원</span>
                      <br />
                      <span>거리: {item.distance}</span>
                    </p>
                  </li>
                );
              })}
        </ul>
      </dialog>
    );
  };

  return (
    <>
      <div>
        <h1>{process}</h1>
        <div
          style={{
            position: "relative",
            textAlign: "center",
            top: "50px",
            zIndex: "1000",
          }}
        >
          <select
            className="selectBox"
            onChange={(e) => {
              setOilType(e.target.value);
            }}
            style={{ width: "100px;" }}
          >
            <option value={"D047"}>경유</option>
            <option value={"B027"}>휘발유</option>
          </select>
        </div>
        <button
          className="btn"
          onClick={() => {
            search().then(() => {
              confetti({
                particleCount: 150,
              });
              setTimeout(() => {
                modalRef.current?.showModal();
              }, 1000);
            });
          }}
        >
          <img src="data:image/png;base64,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"></img>
        </button>
      </div>
      <ModalPop />
    </>
  );
}
