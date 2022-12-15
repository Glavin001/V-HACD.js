#!/usr/bin/env bash
set -e

PROJECT=vhacd

build () {
    emcmake cmake -B builds -DALLOW_MEMORY_GROWTH=1 -DCLOSURE=1 "$@"
    cmake --build builds
}

# pushd src/lib/
# rm -f ./builds/${PROJECT}.*
# rm -f ./builds/dist/${PROJECT}.*

# emcmake cmake -B builds -DCLOSURE=1 #-D CMAKE_CXX_FLAGS="-s ASSERTIONS=1 -s NODERAWFS=1"
# emcmake cmake -B builds -DALLOW_MEMORY_GROWTH=1 -DCLOSURE=1
# emcmake cmake -B builds -DALLOW_MEMORY_GROWTH=1 -DCLOSURE=1 -D CMAKE_CXX_FLAGS="-s ASSERTIONS=1 -s NODERAWFS=1"
# emcmake cmake -B builds -DALLOW_MEMORY_GROWTH=1 -DCLOSURE=1 -D CMAKE_CXX_FLAGS="-s ASSERTIONS=1"

# Development Build
echo
echo "========================================"
echo "Build dev..."
# rm -f ./builds/dist/${PROJECT}.dev.*
# build -DDEBUG=1 -DTHREADS=1
build -DDEBUG=1 -DTHREADS=0
# build -DDEBUG=0 -DTHREADS=1
# build -DDEBUG=0 -DTHREADS=0
# emcmake cmake -B builds -DALLOW_MEMORY_GROWTH=1 -DCLOSURE=1 -DDEBUG=1 -DTHREADS=1
# cmake --build builds
echo

# Production Build
echo
echo "========================================"
echo "Build prod..."
# rm -f ./builds/dist/${PROJECT}.prod.*
# emcmake cmake -B builds -DALLOW_MEMORY_GROWTH=1 -DCLOSURE=1 -DDEBUG=0
# cmake --build builds

# popd

# rm -f builds/CMakeCache.txt

# cmake -B builds
# cmake --build builds

# cp ./src/lib/${PROJECT}.d.ts ./src/lib/builds/${PROJECT}.d.ts
# cp ./${PROJECT}.d.ts ./builds/${PROJECT}.d.ts
# cp ./${PROJECT}.d.ts ./builds/dist/${PROJECT}.dev-threads.d.ts
# cp ./${PROJECT}.d.ts ./builds/dist/${PROJECT}.dev-threads.wasm.d.ts
