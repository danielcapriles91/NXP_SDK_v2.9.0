if(NOT MIDDLEWARE_FATFS_SD_MK66F18_INCLUDED)
    
    set(MIDDLEWARE_FATFS_SD_MK66F18_INCLUDED true CACHE BOOL "middleware_fatfs_sd component is included.")

    target_sources(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/source/fsl_sd_disk/fsl_sd_disk.c
    )


    target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/source/fsl_sd_disk
    )


    include(middleware_fatfs_MK66F18)

    include(middleware_sdmmc_sd_MK66F18)

endif()
