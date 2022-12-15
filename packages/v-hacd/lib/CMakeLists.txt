cmake_minimum_required(VERSION 3.13 FATAL_ERROR)
set(CMAKE_POLICY_DEFAULT_CMP0077 NEW)

# This project requires C++11.
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Project
set(PROJECT_NAME "VHACD")
set(PROJECT_LOWER_NAME "vhacd")
set(OUTPUT_SUFFIX "")
if(${DEBUG})
  set(OUTPUT_SUFFIX ${OUTPUT_SUFFIX}.dev)
else()
  set(OUTPUT_SUFFIX ${OUTPUT_SUFFIX}.prod)
endif()
if(${THREADS})
  set(OUTPUT_SUFFIX ${OUTPUT_SUFFIX}.threads)
endif()
set(OUTPUT_FILE_NAME "${PROJECT_LOWER_NAME}${OUTPUT_SUFFIX}")

FIND_PACKAGE(Python3)
set(PYTHON ${Python3_EXECUTABLE} CACHE STRING "Python path")
set(EMSCRIPTEN_ROOT $ENV{EMSDK}/upstream/emscripten CACHE STRING "Emscripten path")
set(CMAKE_TOOLCHAIN_FILE ${EMSCRIPTEN_ROOT}/cmake/Modules/Platform/Emscripten.cmake)
set(WEBIDL_BINDER_SCRIPT ${EMSCRIPTEN_ROOT}/tools/webidl_binder.py)
set(AMMO_FRONT_MATTER_FILE ${CMAKE_CURRENT_SOURCE_DIR}/front-matter.js)
set(AMMO_BACK_MATTER_FILE ${CMAKE_CURRENT_SOURCE_DIR}/back-matter.js)
set(AMMO_BACK_MATTER_ESM_FILE ${CMAKE_CURRENT_SOURCE_DIR}/back-matter.esm.js)
set(AMMO_ONLOAD_FILE ${CMAKE_CURRENT_SOURCE_DIR}/onload.js)
set(AMMO_HEADER_FILE ${CMAKE_CURRENT_SOURCE_DIR}/${PROJECT_LOWER_NAME}.h)
set(AMMO_BASE_IDL_FILE ${CMAKE_CURRENT_SOURCE_DIR}/${PROJECT_LOWER_NAME}-base.idl)
set(AMMO_THREADS_IDL_FILE ${CMAKE_CURRENT_SOURCE_DIR}/${PROJECT_LOWER_NAME}-threads.idl)
set(AMMO_IDL_FILE ${OUTPUT_FILE_NAME}.idl)
set(GLUE_JS_FILE glue${OUTPUT_SUFFIX}.js)
set(GLUE_CPP_FILE glue${OUTPUT_SUFFIX}.cpp)
set(GLUE_OUTPUT_FILE glue${OUTPUT_SUFFIX}.o)
set(VHACD_JS_FILE dist/${OUTPUT_FILE_NAME}.js)
set(VHACD_ESM_JS_FILE dist/${OUTPUT_FILE_NAME}.esm.js)
set(VHACD_D_TS_FILE dist/${OUTPUT_FILE_NAME}.esm.d.ts)
set(VHACD_WASM_JS_FILE dist/${OUTPUT_FILE_NAME}.wasm.js)
set(VHACD_WASM_ESM_JS_FILE dist/${OUTPUT_FILE_NAME}.wasm.esm.js)
set(VHACD_WASM_D_TS_FILE dist/${OUTPUT_FILE_NAME}.wasm.esm.d.ts)
set(VHACD_SOURCE_D_TS_FILE ${CMAKE_CURRENT_SOURCE_DIR}/${PROJECT_LOWER_NAME}.d.ts)

# if(${DEBUG})
#   set(OUTPUT_FILE_NAME ${PROJECT_LOWER_NAME}.dev)
# else()
#   set(OUTPUT_FILE_NAME ${PROJECT_LOWER_NAME}.prod)
# endif()

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
  ./v-hacd/include/VHACD.h
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
###

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
  --post-js ${GLUE_JS_FILE}
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
  -s EXPORT_NAME=${PROJECT_NAME}
  -s MODULARIZE=1
  -s NO_EXIT_RUNTIME=0
  -s EXIT_RUNTIME=1
  -s NO_FILESYSTEM=1
  #-s RELOCATABLE=1
  #-s USE_PTHREADS=1
  #-s ASYNCIFY=1
  # -s ASSERTIONS=1 ## TODO disable
  #-s PTHREAD_POOL_SIZE_STRICT=0
  # -s EXPORT_ES6=1
  # -s PROXY_TO_PTHREAD=1
  -s TOTAL_MEMORY=${TOTAL_MEMORY})

set(EMCC_GLUE_ARGS
  -c
#  -s USE_PTHREADS
#  -s ASYNCIFY
  # -s PROXY_TO_PTHREAD
  -include${AMMO_HEADER_FILE})

# set(EMCC_ARGS_THREADS
#   -s USE_PTHREADS
#   -s ASYNCIFY
#   # -s PROXY_TO_PTHREAD
# )

if(${THREADS})
  message(STATUS "Threads mode: ON")
  # set(OUTPUT_FILE_NAME ${OUTPUT_FILE_NAME}.threads)
  LIST(APPEND EMCC_ARGS
    -s USE_PTHREADS
    -s ASYNCIFY)
  LIST(APPEND EMCC_GLUE_ARGS
    -s USE_PTHREADS
    -s ASYNCIFY)
  add_custom_command(
    OUTPUT ${AMMO_IDL_FILE}
    COMMAND cat ${AMMO_BASE_IDL_FILE} ${AMMO_THREADS_IDL_FILE} > ${AMMO_IDL_FILE}
    DEPENDS ${AMMO_BASE_IDL_FILE}
    COMMENT "Generating ${AMMO_IDL_FILE} file"
    VERBATIM)
else()
  message(STATUS "Threads mode: OFF")
  add_custom_command(
    OUTPUT ${AMMO_IDL_FILE}
    COMMAND cp ${AMMO_BASE_IDL_FILE} ${AMMO_IDL_FILE}
    DEPENDS ${AMMO_BASE_IDL_FILE}
    COMMENT "Generating ${AMMO_IDL_FILE} file"
    VERBATIM)
endif()

# string(APPEND CMAKE_CXX_FLAGS " -s NODERAWFS=1 -s USE_PTHREADS")
# string(APPEND CMAKE_EXE_LINKER_FLAGS " -s ASYNCIFY") 
# string(APPEND CMAKE_EXE_LINKER_FLAGS " -s PROXY_TO_PTHREAD") 

if(${DEBUG})
  message(STATUS "Debug mode: ON")
  # set(OUTPUT_FILE_NAME ${OUTPUT_FILE_NAME}.dev)
  LIST(APPEND EMCC_ARGS
    -s ASSERTIONS=1)
else()
  message(STATUS "Debug mode: OFF")
  # set(OUTPUT_FILE_NAME ${OUTPUT_FILE_NAME}.prod)
  LIST(APPEND EMCC_ARGS
    -s ASSERTIONS=0)
endif()

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

# set(EMCC_GLUE_ARGS
#   -c
# #  -s USE_PTHREADS
# #  -s ASYNCIFY
#   # -s PROXY_TO_PTHREAD
#   -include${AMMO_HEADER_FILE})


#######################################

project(${PROJECT_NAME} VERSION 1.23.0 LANGUAGES C CXX)

# target_include_directories("VHACD" PUBLIC "./src/lib/v-hacd")
# include_directories(PUBLIC "./src/lib/v-hacd")

add_custom_target(dist-dir ALL
    COMMAND ${CMAKE_COMMAND} -E make_directory dist)

#######################################
add_custom_command(
  OUTPUT ${GLUE_CPP_FILE} ${GLUE_JS_FILE}
  BYPRODUCTS parser.out WebIDLGrammar.pkl
  COMMAND ${PYTHON} ${WEBIDL_BINDER_SCRIPT} ${AMMO_IDL_FILE} glue${OUTPUT_SUFFIX}
  DEPENDS ${AMMO_IDL_FILE}
  COMMENT "Generating ${PROJECT_NAME} bindings"
  VERBATIM)
add_custom_command(
  OUTPUT ${GLUE_OUTPUT_FILE}
  COMMAND emcc ${GLUE_CPP_FILE} ${EMCC_GLUE_ARGS} -o ${GLUE_OUTPUT_FILE}
  DEPENDS ${GLUE_CPP_FILE} ${AMMO_HEADER_FILE}
  COMMENT "Building ${PROJECT_NAME} bindings"
  VERBATIM)
add_custom_target(ammo-bindings ALL DEPENDS ${GLUE_JS_FILE} ${GLUE_OUTPUT_FILE})
# target_compile_definitions(ammo-bindings PRIVATE VHACD_DISABLE_THREADING=1)

# add_custom_command(
#   OUTPUT glue.cpp glue.js
#   BYPRODUCTS parser.out WebIDLGrammar.pkl
#   COMMAND ${PYTHON} ${WEBIDL_BINDER_SCRIPT} ${AMMO_IDL_FILE} glue
#   DEPENDS ${AMMO_IDL_FILE}
#   COMMENT "Generating ${PROJECT_NAME} bindings"
#   VERBATIM)

# add_custom_command(
#   OUTPUT glue-threads.o
#   COMMAND emcc ${GLUE_CPP_FILE} ${EMCC_GLUE_ARGS} ${EMCC_ARGS_THREADS} -o glue-threads.o
#   DEPENDS ${GLUE_CPP_FILE} ${AMMO_HEADER_FILE}
#   COMMENT "Building ${PROJECT_NAME} threads bindings"
#   VERBATIM)
# add_custom_target(ammo-threads-bindings ALL DEPENDS ${GLUE_JS_FILE} glue-threads.o)


#######################################
add_custom_command(
  OUTPUT ${VHACD_JS_FILE}
  COMMAND emcc ${GLUE_OUTPUT_FILE} ${BULLET_LIBS} ${EMCC_JS_ARGS} -o ${VHACD_JS_FILE}
  DEPENDS ammo-bindings dist-dir ${AMMO_FRONT_MATTER_FILE} ${AMMO_BACK_MATTER_FILE} ${AMMO_ONLOAD_FILE} ${BULLET_TARGETS}
  COMMENT "Building ${PROJECT_NAME} JavaScript"
  VERBATIM)
add_custom_command(
  OUTPUT ${VHACD_ESM_JS_FILE}
  COMMAND cat ${VHACD_JS_FILE} ${AMMO_BACK_MATTER_ESM_FILE} > ${VHACD_ESM_JS_FILE}
  DEPENDS ${VHACD_JS_FILE}
  COMMENT "Building ${PROJECT_NAME} ESM JavaScript"
  VERBATIM)
add_custom_command(
  OUTPUT ${VHACD_D_TS_FILE}
  COMMAND cp ${VHACD_SOURCE_D_TS_FILE} ${VHACD_D_TS_FILE}
  DEPENDS ${VHACD_SOURCE_D_TS_FILE}
  COMMENT "Building ${PROJECT_NAME} TypeScript Definitions"
  VERBATIM)
add_custom_target(ammo-javascript ALL DEPENDS ${VHACD_JS_FILE} ${VHACD_ESM_JS_FILE} ${VHACD_D_TS_FILE})
# target_compile_definitions(ammo-javascript PRIVATE VHACD_DISABLE_THREADING=1)

#######################################
# add_custom_command(
#   OUTPUT vhacd-threads.js
#   COMMAND emcc glue-threads.o ${BULLET_LIBS} ${EMCC_JS_ARGS} ${EMCC_ARGS_THREADS} -o dist/${OUTPUT_FILE_NAME}-threads.js
#   DEPENDS ammo-threads-bindings dist-dir ${AMMO_FRONT_MATTER_FILE} ${AMMO_BACK_MATTER_FILE} ${AMMO_ONLOAD_FILE} ${BULLET_TARGETS}
#   COMMENT "Building ${PROJECT_NAME} threads JavaScript"
#   VERBATIM)
# add_custom_target(ammo-threads-javascript ALL DEPENDS vhacd-threads.js)


#######################################
add_custom_command(
  OUTPUT ${VHACD_WASM_JS_FILE} vhacd.wasm.wasm
  COMMAND emcc ${GLUE_OUTPUT_FILE} ${BULLET_LIBS} ${EMCC_WASM_ARGS} -o ${VHACD_WASM_JS_FILE}
  DEPENDS ammo-bindings dist-dir ${AMMO_FRONT_MATTER_FILE} ${AMMO_BACK_MATTER_FILE} ${AMMO_ONLOAD_FILE} ${BULLET_TARGETS}
  COMMENT "Building ${PROJECT_NAME} WebAssembly"
  VERBATIM)
add_custom_command(
  OUTPUT ${VHACD_WASM_ESM_JS_FILE}
  COMMAND cat ${VHACD_WASM_JS_FILE} ${AMMO_BACK_MATTER_ESM_FILE} > ${VHACD_WASM_ESM_JS_FILE}
  DEPENDS ${VHACD_WASM_JS_FILE}
  COMMENT "Building ${PROJECT_NAME} ESM WebAssembly"
  VERBATIM)
add_custom_command(
  OUTPUT ${VHACD_WASM_D_TS_FILE}
  COMMAND cp ${VHACD_SOURCE_D_TS_FILE} ${VHACD_WASM_D_TS_FILE}
  DEPENDS ${VHACD_SOURCE_D_TS_FILE}
  COMMENT "Building ${PROJECT_NAME} TypeScript Definitions for WebAssembly"
  VERBATIM)
add_custom_target(ammo-wasm ALL DEPENDS ${VHACD_WASM_JS_FILE} vhacd.wasm.wasm ${VHACD_WASM_ESM_JS_FILE} ${VHACD_WASM_D_TS_FILE})

#######################################
# add_custom_command(
#   OUTPUT vhacd-threads.wasm.js vhacd-threads.wasm.wasm
#   COMMAND emcc glue-threads.o ${BULLET_LIBS} ${EMCC_WASM_ARGS} ${EMCC_ARGS_THREADS} -o dist/${OUTPUT_FILE_NAME}-threads.wasm.js
#   DEPENDS ammo-bindings dist-dir ${AMMO_FRONT_MATTER_FILE} ${AMMO_BACK_MATTER_FILE} ${AMMO_ONLOAD_FILE} ${BULLET_TARGETS}
#   COMMENT "Building ${PROJECT_NAME} threads WebAssembly"
#   VERBATIM)
# add_custom_target(ammo-threads-wasm ALL DEPENDS vhacd-threads.wasm.js vhacd-threads.wasm.wasm)
