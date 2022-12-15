#!/usr/bin/env bash
# mkdir -p builds/
# rm -rf builds/* builds-em/*

PROJECT=vhacd

# rm -f builds/${PROJECT}.*

pushd src/lib/
rm -f builds/${PROJECT}.*

# emcmake cmake -B builds -DCLOSURE=1 #-D CMAKE_CXX_FLAGS="-s ASSERTIONS=1 -s NODERAWFS=1"
# emcmake cmake -B builds -DALLOW_MEMORY_GROWTH=1 -DCLOSURE=1
# emcmake cmake -B builds -DALLOW_MEMORY_GROWTH=1 -DCLOSURE=1 -D CMAKE_CXX_FLAGS="-s ASSERTIONS=1 -s NODERAWFS=1"
emcmake cmake -B builds -DALLOW_MEMORY_GROWTH=1 -DCLOSURE=1 -D CMAKE_CXX_FLAGS="-s ASSERTIONS=1"
cmake --build builds

cp ./${PROJECT}.d.ts ./builds/${PROJECT}.d.ts

popd

# rm -f builds/CMakeCache.txt

# cmake -B builds
# cmake --build builds

# cp ./src/lib/${PROJECT}.d.ts ./src/lib/builds/${PROJECT}.d.ts
