const UrlModel = require("../models/urlModel");
const ShortId = require("shortid"); //nanoid or UUID
const redis = require("redis");
const { promisify } = require("util");

//********************************************VALIDATION FUNCTIONS********************************************************** */

const isValid = function (value) {
  if (typeof value == "undefined" || value == null) return false;
  if (typeof value == "string" && value.trim().length > 0) return true;
  return false;
};

const isValidRequest = function (object) {
  return Object.keys(object).length > 0;
};

// using regex for validating url
const isValidUrl = function (value) {
  let regexForUrl =
    /(:?^((https|http|HTTP|HTTPS){1}:\/\/)(([w]{3})[\.]{1})?([a-zA-Z0-9]{1,}[\.])[\w]*((\/){1}([\w@?^=%&amp;~+#-_.]+))*)$/;
  return regexForUrl.test(value);
};

//***********************************CONNECT TO REDIS********************************************** */

const redisClient = redis.createClient(
  18737,
  "redis-18737.c245.us-east-1-3.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);

redisClient.auth("yYakwkjGgnOPwetUbnN8GgtEkK5i3bth", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("connected to Redis..");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//*************************************URL SHORTENER************************************************ */

const urlShortener = async function (req, res) {
  const requestBody = req.body;
  const queryParams = req.query;

  //query params must be empty
  if (isValidRequest(queryParams)) {
    return res.status(400).send({ status: false, message: "invalid request" });
  }

  if (!isValidRequest(requestBody)) {
    return res.status(400).send({ status: false, message: "data is required" });
  }
  //base url is taken from readme
  const longUrl = req.body.longUrl;
  const base = "http://localhost:3000";

  if (!isValid(longUrl)) {
    return res.status(400).send({ status: false, message: "URL is required" });
  }

  // if requestBody has more than one key
  if (Object.keys(requestBody).length > 1) {
    return res.status(400).send({ status: false, message: "invalid entry in request body" });
  }

  if (!isValidUrl(longUrl)) {
    return res
      .status(400)
      .send({ status: false, message: "Enter a valid URL" });
  }

  try {
    // first lets check cache memory has any data related to input longURL
    const urlDataFromCache = await GET_ASYNC(longUrl);

    if (urlDataFromCache) {
      const data = {
        longUrl: longUrl,
        urlCode: urlDataFromCache,
        shortUrl: base + "/" + urlDataFromCache,
      };
      res.status(200).send({
        status: true,
        message: "Url shorten successfully",
        data: data,
      });
    } else {
      // now as data is not available is cache memory lets check inside DB
      const urlDataFromDB = await UrlModel.findOne({ longUrl }).select({
        shortUrl: 1,
        longUrl: 1,
        urlCode: 1,
        _id: 0,
      });

      // if url is present in our DB then first add data to cache then send DB fetched data in response
      if (urlDataFromDB) {
        const addingUrlDataInCacheByLongUrl = await SET_ASYNC(
          urlDataFromDB.longUrl,
          urlDataFromDB.urlCode
        );

        const addingUrlDataInCacheByUrlCode = await SET_ASYNC(
          urlDataFromDB.urlCode,
          urlDataFromDB.longUrl
        );

        return res.status(200).send({
          status: true,
          message: "url shorten successfully",
          data: urlDataFromDB,
        });

        //else we will create a new document in DB. Also add same data inside cache memory for future call
      } else {
        // generating random code by using shortid package
        const urlCode = ShortId.generate().toLowerCase();
        const shortUrl = base + "/" + urlCode;

        const urlData = {
          urlCode: urlCode,
          longUrl: longUrl.trim(),
          shortUrl: shortUrl,
        };

        // creating url data inside DB and setting same data to cache memory
        const newUrl = await UrlModel.create(urlData);

        const addingUrlDataInCacheByLongUrl = await SET_ASYNC(
          urlData.longUrl,
          urlData.urlCode
        );

        const addingUrlDataInCacheByUrlCode = await SET_ASYNC(
          urlData.urlCode,
          urlData.longUrl
        );

        // in response we are sending urlData as per demand
        return res.status(201).send({
          status: true,
          message: "url shorten successfully",
          data: urlData,
        });
      }
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

//****************************************GET URL****************************************************** */

const getUrl = async function (req, res) {
  const requestBody = req.body;
  const queryParams = req.query;

  try {
    // query params must be empty
    if (isValidRequest(queryParams)) {
      return res
        .status(400)
        .send({ status: false, message: "invalid request" });
    }

    if (isValidRequest(requestBody)) {
      return res
        .status(400)
        .send({ status: false, message: " input data is not required" });
    }

    const urlCode = req.params.urlCode;

    if ( !/^(?=.*[a-zA-Z].*)[a-zA-Z\d!@#-_$%&*]{8,}$/.test(urlCode)) {
      return res
        .status(400)
        .send({ status: false, message: " enter a valid urlCode"});
    }

    // First lets check inside cache memory
    const urlDataFromCache = await GET_ASYNC(urlCode);

    if (urlDataFromCache) {
      return res.status(302).redirect(urlDataFromCache);
    } else {
      const urlDataByUrlCode = await UrlModel.findOne({ urlCode });

      if (!urlDataByUrlCode) {
        return res
          .status(404)
          .send({ status: false, message: "no such url exist" });
      }

      const addingUrlDataInCacheByUrlCode = SET_ASYNC(
        urlCode,
        urlDataByUrlCode.longUrl
      );
      const addingUrlDataInCacheByLongUrl = SET_ASYNC(
        urlDataByUrlCode.longUrl,
        urlCode
      );

      // if we found the document by urlCode then redirecting the user to original url
      return res.status(302).redirect(urlDataByUrlCode.longUrl);
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

//**********************************EXPORTING BOTH HANDLERS************************************************/

module.exports = { urlShortener, getUrl };
