cmake_minimum_required(VERSION 3.13 FATAL_ERROR)
set(CMAKE_POLICY_DEFAULT_CMP0077 NEW)

# This project requires C++11.
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

FIND_PACKAGE(Python3)
set(PYTHON ${Python3_EXECUTABLE} CACHE STRING "Python path")
set(EMSCRIPTEN_ROOT $ENV{EMSDK}/upstream/emscripten CACHE STRING "Emscripten path")
set(CMAKE_TOOLCHAIN_FILE ${EMSCRIPTEN_ROOT}/cmake/Modules/Platform/Emscripten.cmake)
set(WEBIDL_BINDER_SCRIPT ${EMSCRIPTEN_ROOT}/tools/webidl_binder.py)
set(AMMO_FRONT_MATTER_FILE ${CMAKE_CURRENT_SOURCE_DIR}/front-matter.js)
set(AMMO_BACK_MATTER_FILE ${CMAKE_CURRENT_SOURCE_DIR}/back-matter.js)
set(AMMO_HEADER_FILE ${CMAKE_CURRENT_SOURCE_DIR}/ammo.h)
set(AMMO_IDL_FILE ${CMAKE_CURRENT_SOURCE_DIR}/ammo.idl)
set(AMMO_ONLOAD_FILE ${CMAKE_CURRENT_SOURCE_DIR}/onload.js)

# set(BULLET_TARGETS BulletCollision BulletDynamics BulletSoftBody LinearMath HACD BulletRobotics)
set(BULLET_TARGETS BulletCollision)
foreach(_TARGET ${BULLET_TARGETS})
  list(APPEND BULLET_LIBS $<TARGET_FILE:${_TARGET}>)
endforeach()

SET(BulletCollision_SRCS
)

# include_directories(PUBLIC "./src/lib/v-hacd")

# target_include_directories(BulletCollision PUBLIC "./src/lib/v-hacd")
# FIXME: relative path to variable
SET(BulletCollision_HDRS
  # ./include/VHACD.h
  ./src/lib/v-hacd/include/VHACD.h
)

set(BULLET_VERSION 1 CACHE STRING "Bullet Version")

# ADD_LIBRARY(BulletCollision ${BulletCollision_SRCS} ${BulletCollision_HDRS})
ADD_LIBRARY(BulletCollision ${BulletCollision_SRCS} ${BulletCollision_HDRS})
SET_TARGET_PROPERTIES(BulletCollision PROPERTIES VERSION ${BULLET_VERSION})
SET_TARGET_PROPERTIES(BulletCollision PROPERTIES SOVERSION ${BULLET_VERSION})
# IF (BUILD_SHARED_LIBS)
#   TARGET_LINK_LIBRARIES(BulletCollision LinearMath)
# ENDIF (BUILD_SHARED_LIBS)

# On Linux we need to add pthread to the link
if (WIN32)
else (WIN32)
#	target_link_libraries(BulletCollision pthread)
	target_link_libraries(BulletCollision)
endif (WIN32)

set_target_properties(BulletCollision PROPERTIES LINKER_LANGUAGE CXX)

# Disable bullet graphical benchmarks
set(USE_GRAPHICAL_BENCHMARK OFF)

# Disable bullet GLUT
set(USE_GLUT OFF)

# Build Release by default
set(CMAKE_BUILD_TYPE Release CACHE STRING "Build Type")

# Default is 64*1024*1024 = 64MB
#set(TOTAL_MEMORY 67108864 CACHE STRING "Total Memory")
#set(TOTAL_MEMORY 512MB CACHE STRING "Total Memory")
set(TOTAL_MEMORY 2048MB CACHE STRING "Total Memory")
set(INITIAL_MEMORY 512MB CACHE STRING "Initial Memory")

# Enable for resizable heap, with some amount of slowness
#set(ALLOW_MEMORY_GROWTH 0 CACHE STRING "Allow Memory Growth")
set(ALLOW_MEMORY_GROWTH 1 CACHE STRING "Allow Memory Growth")

set(EMCC_ARGS
  # -v
  --extern-pre-js ${AMMO_FRONT_MATTER_FILE}
  --extern-post-js ${AMMO_BACK_MATTER_FILE}
  --llvm-lto 1
  --post-js glue.js
  --post-js ${AMMO_ONLOAD_FILE}
  -O3
  -s ENVIRONMENT=web,worker ## TODO disable?
  # -s ENVIRONMENT=node ## TODO disable?
  -s INITIAL_MEMORY=${INITIAL_MEMORY}
  -s ALLOW_MEMORY_GROWTH=${ALLOW_MEMORY_GROWTH}
  -s ALLOW_TABLE_GROWTH=${ALLOW_MEMORY_GROWTH}
  -s EXPORTED_FUNCTIONS=["_malloc"]
  -s EXPORTED_RUNTIME_METHODS=["UTF8ToString"]
  -s EXTRA_EXPORTED_RUNTIME_METHODS=["addFunction"]
  -s EXPORT_NAME="Ammo"
  -s MODULARIZE=1
  -s NO_EXIT_RUNTIME=0
  -s EXIT_RUNTIME=1
  -s NO_FILESYSTEM=1
  #-s RELOCATABLE=1
  #-s USE_PTHREADS=1
  #-s ASYNCIFY=1
  -s ASSERTIONS=1 ## TODO disable
  #-s PTHREAD_POOL_SIZE_STRICT=0
  # -s EXPORT_ES6=1
  # -s PROXY_TO_PTHREAD=1
  -s TOTAL_MEMORY=${TOTAL_MEMORY})

# string(APPEND CMAKE_CXX_FLAGS " -s NODERAWFS=1 -s USE_PTHREADS")
# string(APPEND CMAKE_EXE_LINKER_FLAGS " -s ASYNCIFY") 
# string(APPEND CMAKE_EXE_LINKER_FLAGS " -s PROXY_TO_PTHREAD") 

# -s USE_PTHREADS=1 -s WASM=1
if(${CLOSURE})
  # Ignore closure errors about the bullet Node class
  # (Node is a DOM thing too)
  LIST(APPEND EMCC_ARGS
    --closure 1
    -s IGNORE_CLOSURE_COMPILER_ERRORS=1)
else()
  LIST(APPEND EMCC_ARGS
    -s NO_DYNAMIC_EXECUTION=1)
endif()

set(EMCC_JS_ARGS ${EMCC_ARGS}
  -s AGGRESSIVE_VARIABLE_ELIMINATION=1
  -s ELIMINATE_DUPLICATE_FUNCTIONS=1
  -s LEGACY_VM_SUPPORT=1
  -s SINGLE_FILE=1
  -s WASM=0)

set(EMCC_WASM_ARGS ${EMCC_ARGS}
  -s BINARYEN_IGNORE_IMPLICIT_TRAPS=1
  -s WASM=1)

set(EMCC_GLUE_ARGS
  -c
#  -s USE_PTHREADS
#  -s ASYNCIFY
  # -s PROXY_TO_PTHREAD
  -include${AMMO_HEADER_FILE})


#######################################
# project("ammo")
project("ammo" VERSION 1.23.0 LANGUAGES C CXX)

# target_include_directories("ammo" PUBLIC "./src/lib/v-hacd")
# include_directories(PUBLIC "./src/lib/v-hacd")

#######################################
add_custom_command(
  OUTPUT glue.cpp glue.js
  BYPRODUCTS parser.out WebIDLGrammar.pkl
  COMMAND ${PYTHON} ${WEBIDL_BINDER_SCRIPT} ${AMMO_IDL_FILE} glue
  DEPENDS ${AMMO_IDL_FILE}
  COMMENT "Generating ammo bindings"
  VERBATIM)
add_custom_command(
  OUTPUT glue.o
  COMMAND emcc glue.cpp ${EMCC_GLUE_ARGS} -o glue.o
  DEPENDS glue.cpp ${AMMO_HEADER_FILE}
  COMMENT "Building ammo bindings"
  VERBATIM)
add_custom_target(ammo-bindings ALL DEPENDS glue.js glue.o)


#######################################
add_custom_command(
  OUTPUT ammo.js
  COMMAND emcc glue.o ${BULLET_LIBS} ${EMCC_JS_ARGS} -o ammo.js
  DEPENDS ammo-bindings ${AMMO_FRONT_MATTER_FILE} ${AMMO_BACK_MATTER_FILE} ${AMMO_ONLOAD_FILE} ${BULLET_TARGETS}
  COMMENT "Building ammo javascript"
  VERBATIM)
add_custom_target(ammo-javascript ALL DEPENDS ammo.js)


#######################################
add_custom_command(
  OUTPUT ammo.wasm.js ammo.wasm.wasm
  COMMAND emcc glue.o ${BULLET_LIBS} ${EMCC_WASM_ARGS} -o ammo.wasm.js
  DEPENDS ammo-bindings ${AMMO_FRONT_MATTER_FILE} ${AMMO_BACK_MATTER_FILE} ${AMMO_ONLOAD_FILE} ${BULLET_TARGETS}
  COMMENT "Building ammo webassembly"
  VERBATIM)
add_custom_target(ammo-wasm ALL DEPENDS ammo.wasm.js ammo.wasm.wasm)
