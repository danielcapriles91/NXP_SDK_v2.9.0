if(NOT MIDDLEWARE_FATFS_MK66F18_INCLUDED)
    
    set(MIDDLEWARE_FATFS_MK66F18_INCLUDED true CACHE BOOL "middleware_fatfs component is included.")

    target_sources(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/source/diskio.c
        ${CMAKE_CURRENT_LIST_DIR}/source/ff.c
        ${CMAKE_CURRENT_LIST_DIR}/source/ffsystem.c
        ${CMAKE_CURRENT_LIST_DIR}/source/ffunicode.c
    )


    target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/source
    )


    #OR Logic component
    if(CONFIG_USE_middleware_fatfs_ram_MK66F18)
         include(middleware_fatfs_ram_MK66F18)
    endif()
    if(CONFIG_USE_middleware_fatfs_sd_MK66F18)
         include(middleware_fatfs_sd_MK66F18)
    endif()
    if(CONFIG_USE_middleware_fatfs_sdspi_MK66F18)
         include(middleware_fatfs_sdspi_MK66F18)
    endif()
    if(CONFIG_USE_middleware_fatfs_mmc_MK66F18)
         include(middleware_fatfs_mmc_MK66F18)
    endif()
    if(CONFIG_USE_middleware_fatfs_usb_MK66F18)
         include(middleware_fatfs_usb_MK66F18)
    endif()
    if(CONFIG_USE_middleware_fatfs_nand_MK66F18)
         include(middleware_fatfs_nand_MK66F18)
    endif()
    if(NOT (CONFIG_USE_middleware_fatfs_ram_MK66F18 OR CONFIG_USE_middleware_fatfs_sd_MK66F18 OR CONFIG_USE_middleware_fatfs_sdspi_MK66F18 OR CONFIG_USE_middleware_fatfs_mmc_MK66F18 OR CONFIG_USE_middleware_fatfs_usb_MK66F18 OR CONFIG_USE_middleware_fatfs_nand_MK66F18))
        message(WARNING "Since middleware_fatfs_ram_MK66F18/middleware_fatfs_sd_MK66F18/middleware_fatfs_sdspi_MK66F18/middleware_fatfs_mmc_MK66F18/middleware_fatfs_usb_MK66F18/middleware_fatfs_nand_MK66F18 is not included at first or config in config.cmake file, use middleware_fatfs_ram_MK66F18 by default.")
        include(middleware_fatfs_ram_MK66F18)
    endif()

endif()
