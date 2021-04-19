if(NOT CMSIS_DRIVER_INCLUDE_I2C_MK66F18_INCLUDED)
    
    set(CMSIS_DRIVER_INCLUDE_I2C_MK66F18_INCLUDED true CACHE BOOL "CMSIS_Driver_Include_I2C component is included.")


    target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/.
    )

    include(CMSIS_Driver_Include_Common_MK66F18)

endif()
