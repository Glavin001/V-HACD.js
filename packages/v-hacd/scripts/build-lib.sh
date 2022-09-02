#!/usr/bin/env bash
# mkdir -p builds/
# rm -rf builds/* builds-em/*
rm -f builds/ammo.*

# emcmake cmake -B builds -DCLOSURE=1 #-D CMAKE_CXX_FLAGS="-s ASSERTIONS=1 -s NODERAWFS=1"
# emcmake cmake -B builds -DALLOW_MEMORY_GROWTH=1 -DCLOSURE=1
# emcmake cmake -B builds -DALLOW_MEMORY_GROWTH=1 -DCLOSURE=1 -D CMAKE_CXX_FLAGS="-s ASSERTIONS=1 -s NODERAWFS=1"
emcmake cmake -B builds -DALLOW_MEMORY_GROWTH=1 -DCLOSURE=1 -D CMAKE_CXX_FLAGS="-s ASSERTIONS=1"
cmake --build builds

# rm -f builds/CMakeCache.txt

# cmake -B builds
# cmake --build builds
