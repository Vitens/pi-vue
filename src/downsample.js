export default function (data, threshold) {
  // this function is from flot-downsample (MIT), with modifications
  var floor = Math.floor, abs = Math.abs;

  var dataLength = data.length;
  if (threshold >= dataLength || threshold <= 0) {
      return data; // nothing to do
  }

  var sampled = [],
      sampledIndex = 0;

  // bucket size, leave room for start and end data points
  var every = (dataLength - 2) / (threshold - 2);

  var a = 0,  // initially a is the first point in the triangle
      maxAreaPoint,
      maxArea,
      area,
      nextA;

  // always add the first point
  sampled[sampledIndex++] = data[a];

  for (var i = 0; i < threshold - 2; i++) {
      // Calculate point average for next bucket (containing c)
      var avgX = 0,
          avgY = 0,
          avgRangeStart = floor(( i + 1 ) * every) + 1,
          avgRangeEnd = floor(( i + 2 ) * every) + 1;
      avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;

      var avgRangeLength = avgRangeEnd - avgRangeStart;

      for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
          avgX += data[avgRangeStart].x * 1; // * 1 enforces Number (value may be Date)
          avgY += data[avgRangeStart].y * 1;
      }
      avgX /= avgRangeLength;
      avgY /= avgRangeLength;

      // Get the range for this bucket
      var rangeOffs = floor((i + 0) * every) + 1,
          rangeTo = floor((i + 1) * every) + 1;

      // Point a
      var pointAX = data[a].x * 1, // enforce Number (value may be Date)
          pointAY = data[a].y * 1;

      maxArea = area = -1;

      for (; rangeOffs < rangeTo; rangeOffs++) {
          // Calculate triangle area over three buckets
          area = abs(( pointAX - avgX ) * ( data[rangeOffs].y - pointAY ) -
                  ( pointAX - data[rangeOffs].x ) * ( avgY - pointAY )
              ) * 0.5;
          if (area > maxArea) {
              maxArea = area;
              maxAreaPoint = data[rangeOffs];
              nextA = rangeOffs; // Next a is this b
          }
      }

      sampled[sampledIndex++] = maxAreaPoint; // Pick this point from the bucket
      a = nextA; // This a is the next a (chosen b)
  }

  sampled[sampledIndex] = data[dataLength - 1]; // Always add last

  return sampled;
}