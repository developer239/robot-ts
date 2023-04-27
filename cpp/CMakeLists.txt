cmake_minimum_required(VERSION 3.24)

project(robotcpp_node_bindings)

set(CMAKE_CXX_STANDARD 14)

# Use cmake-js provided node-addon-api and Node.js include directories
include_directories(${CMAKE_JS_INC})

# Define the Node.js addon target
add_library(${PROJECT_NAME} SHARED
  src/main.cpp
  src/MouseBinding.h
  src/MouseBinding.cpp
  src/KeyboardBinding.h
  src/KeyboardBinding.cpp
  src/ScreenBinding.h
  src/ScreenBinding.cpp
  ${CMAKE_JS_SRC}
)

# Set target output name to 'addon.node'
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

# Add RobotCPP submodule library
add_subdirectory(${CMAKE_SOURCE_DIR}/externals/robot-cpp)

# Link the RobotCPP library and cmake-js provided Node.js runtime libraries
target_link_libraries(${PROJECT_NAME} PRIVATE
  RobotCPP
  ${CMAKE_JS_LIB}
)

# Set the output directory to 'build/Release' for compatibility with Node.js
set_target_properties(${PROJECT_NAME} PROPERTIES
  LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/Release
)

# Include Node-API wrappers
execute_process(COMMAND node -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE NODE_ADDON_API_DIR
        )
string(REGEX REPLACE "[\r\n\"]" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})

target_include_directories(${PROJECT_NAME} PRIVATE ${NODE_ADDON_API_DIR})

# define NAPI_VERSION
add_definitions(-DNAPI_VERSION=3)
