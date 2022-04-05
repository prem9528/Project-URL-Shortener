const UrlModel = require("../models/urlModel");
const ShortId = require("shortid"); //nanoid or UUID

//********************************************VALIDATION FUNCTION********************************************************** */

const isValid = function (value) {
  if (typeof value == "undefined" || value == null) return false;
  if (typeof value == "string" && value.trim().length > 0) return true;
  return false;
};

const isValidRequest = function (object) {
  return Object.keys(object).length > 0;
};

const isValidUrl = function (value) {
  let regexForUrl =
    /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;
  return regexForUrl.test(value);
};

//*************************************URL SHORTENER************************************************ */

const urlShortener = async function (req, res) {
  const requestBody = req.body;
  const queryParams = req.query;

  if (isValidRequest(queryParams)) {
    return res.status(400).send({ status: false, message: "invalid request" });
  }

  if (!isValidRequest(requestBody)) {
    return res.status(400).send({ status: false, message: "data is required" });
  }

  const longUrl = req.body.longUrl;
  const base = "http://localhost:3000";

  if (!isValid(longUrl)) {
    return res.status(400).send({ status: false, message: "URL is required" });
  }

  if (Object.keys(requestBody).length > 1) {
    return res.status(400).send({ status: false, message: "invalid request" });
  }

  if (!isValidUrl(longUrl)) {
    return res
      .status(400)
      .send({ status: false, message: "Enter a valid URL" });
  }

  try {
    let urlCode = ShortId.generate();

    const url = await UrlModel.findOne({ longUrl }).select({shortUrl : 1, longUrl : 1, urlCode : 1, _id : 0});

    if (url) {
     return res
        .status(200)
        .send({ status: true, message: "url shorten successfully", data: url });

    } else {
      const shortUrl = `${base}/${urlCode}`;

      const urlData = {
        urlCode: urlCode,
        longUrl: longUrl.trim(),
        shortUrl: shortUrl,
      };

      const newUrl = await UrlModel.create(urlData);

      return res
        .status(201)
        .send({
          status: true,
          message: "url shorten successfully",
          data: urlData,
        });
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

    if (!urlCode) {
      return res
        .status(400)
        .send({ status: false, message: " urlCode is required" });
    }

    const findUrlDetailsByCode = await UrlModel.findOne({ urlCode: urlCode.toLowerCase() });

    if (!findUrlDetailsByCode) {
      return res
        .status(404)
        .send({ status: false, message: "no such url exist" });
    }

    res.redirect(findUrlDetailsByCode.longUrl);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

//**********************************EXPORTING BOTH HANDLERS************************************************/

module.exports.urlShortener = urlShortener;
module.exports.getUrl = getUrl;
