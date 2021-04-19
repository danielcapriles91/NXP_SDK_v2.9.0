if(NOT UTILITY_DEBUG_CONSOLE_MK66F18_INCLUDED)

set(UTILITY_DEBUG_CONSOLE_MK66F18_INCLUDED true CACHE BOOL "utility_debug_console component is included.")

target_sources(${MCUX_SDK_PROJECT_NAME} PRIVATE
${CMAKE_CURRENT_LIST_DIR}/fsl_debug_console.c
${CMAKE_CURRENT_LIST_DIR}/fsl_str.c
)


target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
${CMAKE_CURRENT_LIST_DIR}/
)


include(component_serial_manager_MK66F18)

include(driver_common_MK66F18)

endif()
