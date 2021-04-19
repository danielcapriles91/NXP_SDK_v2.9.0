if(NOT MIDDLEWARE_MCU-BOOT_MK66F18_STARTUP_MK66F18_INCLUDED)
    
    set(MIDDLEWARE_MCU-BOOT_MK66F18_STARTUP_MK66F18_INCLUDED true CACHE BOOL "middleware_mcu-boot_MK66F18_startup component is included.")

    target_sources(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/src/startup/crt0_gcc.S
        ${CMAKE_CURRENT_LIST_DIR}/targets/MK66F18/src/startup/gcc/startup_MK66F18.S
        ${CMAKE_CURRENT_LIST_DIR}/../../devices/MK66F18/system_MK66F18.c
    )


    target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/../../devices/MK66F18
    )


endif()
