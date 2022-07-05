import { createApi } from "unsplash-js";
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import { readFile } from "fs/promises";

global.fetch = fetch;
const app = express();
dotenv.config();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("dist"));
app.use(cors());
app.set("views", "./dist/views");
app.set("view engine", "ejs");

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
});

// PARSE THROUGH CITY LIST JSON FOR CITY ID
const cityList = JSON.parse(
  await readFile(new URL("./dist/src/city.list.json", import.meta.url))
);

const findId = (city, countryCode) => {
  const found = cityList.filter((place) => {
    return place.name === city && place.country === countryCode;
  });

  const id = found[0].id;
  return id;
};

// FETCH CITY PICTURE FROM UNSPLASH
const fetchPhoto = async (city) => {
  const photo = await unsplash.search.getPhotos({
    query: city,
    page: 1,
    perPage: 10,
    orientation: "landscape",
    contentFilter: "high",
    orderBy: "relevant",
  });
  const photosArr = photo.response.results;
  const randomIndex = Math.floor(Math.random() * 10);
  const randomPhoto = photosArr[randomIndex].urls.regular;
  const photoAltDescription = photosArr[randomIndex].alt_description;
  return { randomPhoto, photoAltDescription };
};

// FETCH WEATHER INFO FROM OPEN WEATHER API
const fetchWeather = async (id) => {
  const weather = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?id=${id}&appid=${process.env.OPEN_WEATHER_KEY}&units=metric`
  );
  return weather;
};

app.get("/", (req, res) => {
  try {
    res.render("index.ejs");
  } catch (error) {
    console.log(error);
  }
});

app.post("/info", async (req, res) => {
  try {
    let city = req.body.city.split(",")[0].trim();
    city = city.charAt(0).toUpperCase() + city.slice(1);

    const countryCode = req.body.city.split(",")[1].toUpperCase().trim();
    const id = findId(city, countryCode);

    const photo = (await fetchPhoto(city)).randomPhoto;
    const altText = (await fetchPhoto(city)).photoAltDescription;

    let weather = (await fetchWeather(id)).json();
    weather = await weather;

    const icon = `http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;

    const image = {
      image: photo,
      text: altText,
      city: city.toUpperCase(),
    };

    res.render("info.ejs", {
      image: image,
      weather: weather,
      icon: icon,
    });
  } catch (error) {
    console.log(error);
    res.render("error.ejs");
  }
});

app.listen(process.env.PORT || 8000, () => {
  console.log(`Server running`);
});
