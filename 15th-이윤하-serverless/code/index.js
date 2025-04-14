const AWS = require('aws-sdk');
const util = require('util');
const sharp = require('sharp');
const s3 = new AWS.S3();

/**
 * 람다 사용 전 dependency 인스톨은 npm install --platform=linux --arch=x64 aws-sdk util sharp 로 할 것
 * 이후 zip으로 압축하여 업로드 한다.
 * node_modules는 nodejs 디렉토리에 넣어 zip으로 압축한 후, 람다 레이어로 업로드 한다.
 * 이후 람다 레이어를 람다 함수에 추가한다.
 */
exports.handler = async (event, context, callback) => {

    // S3에서 이벤트를 가져온다.
    const srcBucket = event.Records[0].s3.bucket.name;
    const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    const dstKey = srcKey;

    // 이미지 타입을 확인
    const typeMatch = srcKey.match(/\.([^.]*)$/);
    if (!typeMatch) {
        console.log("Could not determine the image type.");
        return;
    }

    // 이미지 타입이 지원하는지 여부를 검증한다.
    const imageType = typeMatch[1].toLowerCase();
    if (imageType != "jpg" && imageType != "png") {
        console.log(`Unsupported image type: ${imageType}`);
        return;
    }

    // 이미지를 S3 버킷에서 가져온다
    try {
        const params = {
            Bucket: srcBucket,
            Key: srcKey
        };
        var origimage = await s3.getObject(params).promise();

    } catch (error) {
        console.log(error);
        return;
    }

    // 썸네일을 생성한다.
    const width = parseInt((process.env.width) ? process.env.width : 200);
    const height = parseInt((process.env.height) ? process.env.height : 200);
    try {
        var buffer = await sharp(origimage.Body).resize(width, height).toBuffer();

    } catch (error) {
        console.log(error);
        return;
    }

    // 생성된 썸네일을 업로드한다.
    try {
        const destparams = {
            Bucket: srcBucket,
            Key: "resized/" + dstKey,
            Body: buffer,
            ContentType: "image"
        };

        await s3.putObject(destparams).promise();

    } catch (error) {
        console.log(error);
        return;
    }

    console.log(`${srcBucket}/${srcKey} 이미지를 리사이징 하여 ${srcBucket}/resized/${dstKey}에 업로드 하였습니다`);
};